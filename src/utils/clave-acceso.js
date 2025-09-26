/**
 * Genera clave de acceso SRI de 49 dígitos
 * Estructura: DDMMAAAA + TIPO_COMP + RUC + AMBIENTE + SERIE + SECUENCIAL + COD_NUM + TIPO_EMISION + DIG_VERIF
 */

function generarClaveAcceso(params) {
  const {
    fechaEmision,
    tipoComprobante,
    ruc,
    ambiente,
    establecimiento,
    puntoEmision,
    secuencial,
    codigoNumerico
  } = params;

  // Formatear fecha DDMMAAAA
  const fecha = new Date(fechaEmision);
  const dd = fecha.getDate().toString().padStart(2, '0');
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const aaaa = fecha.getFullYear().toString();
  const fechaStr = dd + mm + aaaa;

  // Construir clave sin dígito verificador
  const serie = establecimiento + puntoEmision;
  const secuencialStr = secuencial.toString().padStart(9, '0');
  const codigoNumericoStr = codigoNumerico.toString().padStart(8, '0');
  const tipoEmision = '1'; // Siempre 1 para offline

  const claveSinDigito =
    fechaStr +
    tipoComprobante +
    ruc +
    ambiente +
    serie +
    secuencialStr +
    codigoNumericoStr +
    tipoEmision;

  // Calcular dígito verificador (módulo 11)
  const digitoVerificador = calcularDigitoVerificador(claveSinDigito);

  return claveSinDigito + digitoVerificador;
}

function calcularDigitoVerificador(clave) {
  const factores = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let suma = 0;
  for (let i = 0; i < clave.length; i++) {
    suma += parseInt(clave[i]) * factores[i];
  }

  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 1 : 11 - resto;

  return digitoVerificador.toString();
}

function validarClaveAcceso(claveAcceso) {
  if (!claveAcceso || claveAcceso.length !== 49) {
    return { valida: false, error: 'Clave de acceso debe tener 49 dígitos' };
  }

  const claveSinDigito = claveAcceso.substring(0, 48);
  const digitoRecibido = claveAcceso.substring(48);
  const digitoCalculado = calcularDigitoVerificador(claveSinDigito);

  if (digitoRecibido !== digitoCalculado) {
    return {
      valida: false,
      error: `Dígito verificador inválido. Esperado: ${digitoCalculado}, Recibido: ${digitoRecibido}`
    };
  }

  return { valida: true };
}

function generarCodigoNumerico() {
  return Math.floor(Math.random() * 99999999) + 1;
}

module.exports = {
  generarClaveAcceso,
  calcularDigitoVerificador,
  validarClaveAcceso,
  generarCodigoNumerico,
};