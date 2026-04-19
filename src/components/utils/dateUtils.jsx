import { parseISO, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Offset do horário de Brasília (UTC-3)
const BRASILIA_OFFSET = -3 * 60; // em minutos

/**
 * Converte uma data para o horário de Brasília
 */
export function toBrasiliaTime(date) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (BRASILIA_OFFSET * 60000));
}

/**
 * Obtém a data atual no horário de Brasília
 */
export function getBrasiliaDate() {
  return toBrasiliaTime(new Date());
}

/**
 * Interpreta uma string de data YYYY-MM-DD como início do dia no fuso horário de Brasília
 */
export function parseDateLocal(dateString) {
  if (!dateString) return null;
  
  // Se a string for apenas YYYY-MM-DD, crie um objeto Date no horário de Brasília
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return toBrasiliaTime(date);
  }
  
  // Para strings ISO completas, use parseISO e converta para Brasília
  return toBrasiliaTime(parseISO(dateString));
}

/**
 * Formata uma data de forma segura no horário de Brasília
 */
export function formatDateSafely(dateString, formatString) {
  if (!dateString) return '-';
  
  try {
    const date = parseDateLocal(dateString);
    if (!date || isNaN(date.getTime())) return '-';
    
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error);
    return '-';
  }
}

/**
 * Obtém o início do dia no horário de Brasília
 */
export function getStartOfDayBrasilia(date = getBrasiliaDate()) {
  return startOfDay(date);
}

/**
 * Obtém o fim do dia no horário de Brasília
 */
export function getEndOfDayBrasilia(date = getBrasiliaDate()) {
  return endOfDay(date);
}

/**
 * Obtém o início da semana no horário de Brasília
 */
export function getStartOfWeekBrasilia(date = getBrasiliaDate()) {
  return startOfWeek(date, { weekStartsOn: 1 }); // Segunda-feira como início da semana
}

/**
 * Obtém o fim da semana no horário de Brasília
 */
export function getEndOfWeekBrasilia(date = getBrasiliaDate()) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Obtém o início do mês no horário de Brasília
 */
export function getStartOfMonthBrasilia(date = getBrasiliaDate()) {
  return startOfMonth(date);
}

/**
 * Obtém o fim do mês no horário de Brasília
 */
export function getEndOfMonthBrasilia(date = getBrasiliaDate()) {
  return endOfMonth(date);
}

/**
 * Obtém todos os dias de um intervalo
 */
export function getDaysInInterval(start, end) {
  return eachDayOfInterval({ start, end });
}

/**
 * Obtém todas as semanas de um intervalo
 */
export function getWeeksInInterval(start, end) {
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
}