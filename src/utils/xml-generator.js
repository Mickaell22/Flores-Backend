const { SRI_CONFIG } = require('../config/sri');

/**
 * Genera XML de factura según especificación SRI
 */
function generarXMLFactura(invoice, order, customer, sriConfig) {
  const infoTributaria = generarInfoTributaria(invoice, sriConfig);
  const infoFactura = generarInfoFactura(order, customer);
  const detalles = generarDetalles(order.items);
  const infoAdicional = generarInfoAdicional(order);

  return `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
${infoTributaria}
${infoFactura}
${detalles}
${infoAdicional}
</factura>`;
}

function generarInfoTributaria(invoice, sriConfig) {
  return `  <infoTributaria>
    <ambiente>${sriConfig.ambiente}</ambiente>
    <tipoEmision>${invoice.tipoEmision}</tipoEmision>
    <razonSocial>${escapeXml(sriConfig.razonSocial)}</razonSocial>
    <nombreComercial>${escapeXml(sriConfig.nombreComercial || sriConfig.razonSocial)}</nombreComercial>
    <ruc>${sriConfig.ruc}</ruc>
    <claveAcceso>${invoice.claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${invoice.establecimiento}</estab>
    <ptoEmi>${invoice.puntoEmision}</ptoEmi>
    <secuencial>${invoice.secuencial}</secuencial>
    <dirMatriz>${escapeXml(sriConfig.dirMatriz)}</dirMatriz>
  </infoTributaria>`;
}

function generarInfoFactura(order, customer) {
  const fechaEmision = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `  <infoFactura>
    <fechaEmision>${fechaEmision}</fechaEmision>
    <dirEstablecimiento>${escapeXml(order.shippingAddress || 'Matriz')}</dirEstablecimiento>
    <contribuyenteEspecial>000</contribuyenteEspecial>
    <obligadoContabilidad>NO</obligadoContabilidad>
    <tipoIdentificacionComprador>${mapTipoIdentificacion(customer.tipoIdentificacion)}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(customer.razonSocial)}</razonSocialComprador>
    <identificacionComprador>${customer.identificacion}</identificacionComprador>
    ${customer.direccion ? `<direccionComprador>${escapeXml(customer.direccion)}</direccionComprador>` : ''}
    <totalSinImpuestos>${formatDecimal(order.subtotal)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    ${generarTotalConImpuestos(order)}
    <propina>0.00</propina>
    <importeTotal>${formatDecimal(order.total)}</importeTotal>
    <moneda>DOLAR</moneda>
    ${generarPagos(order)}
  </infoFactura>`;
}

function generarTotalConImpuestos(order) {
  return `    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>2</codigoPorcentaje>
        <baseImponible>${formatDecimal(order.subtotal)}</baseImponible>
        <valor>${formatDecimal(order.iva)}</valor>
      </totalImpuesto>
    </totalConImpuestos>`;
}

function generarPagos(order) {
  const formaPago = mapFormaPago(order.paymentMethod);
  return `    <pagos>
      <pago>
        <formaPago>${formaPago}</formaPago>
        <total>${formatDecimal(order.total)}</total>
        <plazo>0</plazo>
        <unidadTiempo>dias</unidadTiempo>
      </pago>
    </pagos>`;
}

function generarDetalles(items) {
  const detallesXml = items.map((item, index) => {
    return `    <detalle>
      <codigoPrincipal>${item.product.sku}</codigoPrincipal>
      <descripcion>${escapeXml(item.product.name)}</descripcion>
      <cantidad>${item.quantity}</cantidad>
      <precioUnitario>${formatDecimal(item.price)}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${formatDecimal(item.subtotal)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>2</codigoPorcentaje>
          <tarifa>15.00</tarifa>
          <baseImponible>${formatDecimal(item.subtotal)}</baseImponible>
          <valor>${formatDecimal(item.subtotal * 0.15)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
  }).join('\n');

  return `  <detalles>
${detallesXml}
  </detalles>`;
}

function generarInfoAdicional(order) {
  let infoAdicional = `  <infoAdicional>`;

  if (order.notes) {
    infoAdicional += `
    <campoAdicional nombre="OBSERVACIONES">${escapeXml(order.notes)}</campoAdicional>`;
  }

  if (order.user?.profile) {
    infoAdicional += `
    <campoAdicional nombre="VENDEDOR">${escapeXml(order.user.profile.firstName + ' ' + order.user.profile.lastName)}</campoAdicional>`;
  }

  infoAdicional += `
  </infoAdicional>`;

  return infoAdicional;
}

// Mapeo de tipos de identificación SRI
function mapTipoIdentificacion(tipo) {
  const mapeo = {
    'RUC': '04',
    'CEDULA': '05',
    'PASAPORTE': '06',
    'CONSUMIDOR_FINAL': '07',
    'EXTERIOR': '08'
  };
  return mapeo[tipo] || '07';
}

// Mapeo de formas de pago SRI
function mapFormaPago(metodoPago) {
  const mapeo = {
    'efectivo': '01',
    'transferencia': '17',
    'tarjeta_credito': '19',
    'tarjeta_debito': '16',
    'otros': '20'
  };
  return mapeo[metodoPago?.toLowerCase()] || '20';
}

// Funciones auxiliares
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDecimal(number) {
  return parseFloat(number).toFixed(2);
}

module.exports = {
  generarXMLFactura,
  escapeXml,
  formatDecimal,
  mapTipoIdentificacion,
  mapFormaPago
};