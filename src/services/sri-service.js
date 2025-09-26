const https = require('https');
const fs = require('fs');
const { promisify } = require('util');
const { prisma } = require('../config/database');
const { getCurrentConfig } = require('../config/sri');
const { generarClaveAcceso, generarCodigoNumerico } = require('../utils/clave-acceso');
const { generarXMLFactura } = require('../utils/xml-generator');

class SRIService {
  constructor() {
    this.config = getCurrentConfig();
  }

  /**
   * Crear factura desde orden
   */
  async crearFactura(orderId) {
    try {
      // Obtener orden completa
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          user: { include: { profile: true } },
          items: { include: { product: true } },
          invoice: true
        }
      });

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      if (order.invoice) {
        throw new Error('La orden ya tiene una factura asociada');
      }

      // Obtener configuración SRI activa
      const sriConfig = await this.getSriConfiguration();
      if (!sriConfig) {
        throw new Error('No hay configuración SRI activa');
      }

      // Generar secuencial
      const secuencial = await this.getNextSecuencial();

      // Generar clave de acceso
      const claveAcceso = generarClaveAcceso({
        fechaEmision: new Date(),
        tipoComprobante: '01', // Factura
        ruc: sriConfig.ruc,
        ambiente: sriConfig.ambiente,
        establecimiento: '001',
        puntoEmision: '001',
        secuencial: secuencial,
        codigoNumerico: generarCodigoNumerico()
      });

      // Crear registro de factura
      const invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          claveAcceso,
          secuencial: secuencial.toString().padStart(9, '0'),
          establecimiento: '001',
          puntoEmision: '001',
          ambiente: sriConfig.ambiente,
          tipoEmision: '1'
        }
      });

      // Generar XML
      const xmlContent = generarXMLFactura(invoice, order, order.customer, sriConfig);

      // Actualizar factura con XML
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { xmlContent },
        include: {
          order: {
            include: {
              customer: true,
              items: { include: { product: true } }
            }
          }
        }
      });

      return updatedInvoice;
    } catch (error) {
      console.error('Error creando factura:', error);
      throw error;
    }
  }

  /**
   * Firmar XML electrónicamente
   */
  async firmarXML(invoiceId) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice || !invoice.xmlContent) {
        throw new Error('Factura o XML no encontrado');
      }

      // Obtener configuración SRI
      const sriConfig = await this.getSriConfiguration();

      // TODO: Implementar firma digital XAdES-BES
      // Por ahora simulamos la firma
      const xmlSigned = this.simularFirmaDigital(invoice.xmlContent);

      // Actualizar factura con XML firmado
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          xmlSigned,
          estado: 'ENVIADO'
        }
      });

      return updatedInvoice;
    } catch (error) {
      console.error('Error firmando XML:', error);
      throw error;
    }
  }

  /**
   * Enviar factura al SRI
   */
  async enviarFactura(invoiceId) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice || !invoice.xmlSigned) {
        throw new Error('Factura o XML firmado no encontrado');
      }

      // Construir SOAP envelope
      const soapEnvelope = this.buildSoapEnvelope(invoice.xmlSigned);

      // Enviar a SRI
      const response = await this.callSriWebService(
        this.config.endpoints.recepcion,
        soapEnvelope
      );

      // Procesar respuesta
      const result = this.parseSriResponse(response);

      // Actualizar estado de factura
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          estado: result.estado,
          errorMessage: result.error || null
        }
      });

      return result;
    } catch (error) {
      console.error('Error enviando factura:', error);

      // Marcar como error
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          estado: 'ERROR',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Consultar autorización en SRI
   */
  async consultarAutorizacion(invoiceId) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      // Construir SOAP para consulta
      const soapEnvelope = this.buildConsultaSoapEnvelope(invoice.claveAcceso);

      // Consultar en SRI
      const response = await this.callSriWebService(
        this.config.endpoints.autorizacion,
        soapEnvelope
      );

      // Procesar respuesta
      const result = this.parseAutorizacionResponse(response);

      // Actualizar factura
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          estado: result.estado,
          numeroAutorizacion: result.numeroAutorizacion || null,
          fechaAutorizacion: result.fechaAutorizacion || null,
          xmlAuthorized: result.xmlAutorizado || null,
          errorMessage: result.error || null
        }
      });

      return updatedInvoice;
    } catch (error) {
      console.error('Error consultando autorización:', error);
      throw error;
    }
  }

  /**
   * Obtener siguiente secuencial
   */
  async getNextSecuencial() {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return lastInvoice ? parseInt(lastInvoice.secuencial) + 1 : 1;
  }

  /**
   * Obtener configuración SRI activa
   */
  async getSriConfiguration() {
    return await prisma.sriConfiguration.findFirst({
      where: { isActive: true }
    });
  }

  /**
   * Simular firma digital (para desarrollo)
   */
  simularFirmaDigital(xmlContent) {
    // En producción, aquí iría la implementación real de XAdES-BES
    const signature = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="Signature">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <ds:Reference URI="#comprobante">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <ds:DigestValue>SIMULATED_DIGEST</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>SIMULATED_SIGNATURE</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>SIMULATED_CERTIFICATE</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
</ds:Signature>`;

    return xmlContent.replace('</factura>', signature + '\n</factura>');
  }

  /**
   * Construir SOAP envelope para recepción
   */
  buildSoapEnvelope(xmlContent) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soap:Header/>
  <soap:Body>
    <ec:validarComprobante>
      <xml>${Buffer.from(xmlContent).toString('base64')}</xml>
    </ec:validarComprobante>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Construir SOAP envelope para consulta de autorización
   */
  buildConsultaSoapEnvelope(claveAcceso) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soap:Header/>
  <soap:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Llamar web service SRI
   */
  async callSriWebService(endpoint, soapEnvelope) {
    return new Promise((resolve, reject) => {
      const postData = soapEnvelope;
      const options = {
        hostname: this.config.baseUrl.replace('https://', ''),
        port: 443,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Parsear respuesta SRI de recepción
   */
  parseSriResponse(response) {
    // Simplificado para desarrollo
    if (response.includes('RECIBIDA')) {
      return { estado: 'ENVIADO' };
    } else {
      return {
        estado: 'ERROR',
        error: 'Error en recepción SRI'
      };
    }
  }

  /**
   * Parsear respuesta de autorización
   */
  parseAutorizacionResponse(response) {
    // Simplificado para desarrollo
    if (response.includes('AUTORIZADO')) {
      return {
        estado: 'AUTORIZADO',
        numeroAutorizacion: '1234567890',
        fechaAutorizacion: new Date(),
        xmlAutorizado: response
      };
    } else {
      return {
        estado: 'NO_AUTORIZADO',
        error: 'No autorizada por SRI'
      };
    }
  }

  /**
   * Probar conexión con SRI
   */
  async probarConexion() {
    try {
      const testSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <test>ping</test>
  </soap:Body>
</soap:Envelope>`;

      await this.callSriWebService(this.config.endpoints.recepcion, testSoap);
      return { success: true, message: 'Conexión exitosa con SRI' };
    } catch (error) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`
      };
    }
  }
}

module.exports = new SRIService();