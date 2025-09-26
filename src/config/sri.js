const SRI_CONFIG = {
  // Configuración de pruebas SRI Ecuador
  PRUEBAS: {
    ruc: '1790012340001',
    ambiente: '1',
    tipoEmision: '1',
    baseUrl: 'https://celeer.sri.gob.ec',
    endpoints: {
      recepcion: '/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
      autorizacion: '/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
      consulta: '/comprobantes-electronicos-ws/ConsultaComprobante'
    }
  },

  PRODUCCION: {
    ambiente: '2',
    tipoEmision: '1',
    baseUrl: 'https://cel.sri.gob.ec',
    endpoints: {
      recepcion: '/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
      autorizacion: '/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
      consulta: '/comprobantes-electronicos-ws/ConsultaComprobante'
    }
  },

  // Tipos de comprobantes
  TIPOS_COMPROBANTE: {
    FACTURA: '01',
    NOTA_CREDITO: '04',
    NOTA_DEBITO: '05',
    GUIA_REMISION: '06',
    COMPROBANTE_RETENCION: '07'
  },

  // Tipos de identificación
  TIPOS_IDENTIFICACION: {
    RUC: '04',
    CEDULA: '05',
    PASAPORTE: '06',
    CONSUMIDOR_FINAL: '07',
    EXTERIOR: '08'
  },

  // Tarifas IVA
  TARIFAS_IVA: {
    CERO_PORCIENTO: { codigo: '0', tarifa: 0 },
    DOCE_PORCIENTO: { codigo: '2', tarifa: 12 },
    CATORCE_PORCIENTO: { codigo: '3', tarifa: 14 },
    QUINCE_PORCIENTO: { codigo: '4', tarifa: 15 },
    CINCO_PORCIENTO: { codigo: '5', tarifa: 5 },
    NO_OBJETO: { codigo: '6', tarifa: 0 },
    EXENTO: { codigo: '7', tarifa: 0 }
  }
};

const getCurrentConfig = () => {
  const ambiente = process.env.SRI_AMBIENTE || '1';
  return ambiente === '1' ? SRI_CONFIG.PRUEBAS : SRI_CONFIG.PRODUCCION;
};

module.exports = {
  SRI_CONFIG,
  getCurrentConfig,
};