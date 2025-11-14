/**
 * Обработка текста сообщений от нейронки
 * Удаляет специальные символы, форматирует текст
 */

/**
 * Очищает текст от непонятных символов и специальных последовательностей
 */
export function cleanText(text) {
  if (!text) return '';

  // Удаляем специальные управляющие последовательности
  let cleaned = text
    // Удаляем ANSI коды цветов и форматирования
    .replace(/\x1b\[[0-9;]*m/g, '')
    // Удаляем нулевые байты
    .replace(/\0/g, '')
    // Удаляем контрольные символы (кроме переноса строки и табуляции)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Заменяем множественные пробелы на один (но не в начале абзацев)
    .replace(/([^ ])\s{2,}/g, '$1 ')
    // Удаляем пробелы в конце строк
    .replace(/[ \t]+$/gm, '')
    // Удаляем пустые строки в начале и конце
    .trim();

  return cleaned;
}

/**
 * Форматирует LaTeX формулы в тексте
 * Находит $...$ для inline и $$...$$ для display формулы
 */
export function extractFormulas(text) {
  const parts = [];
  let lastIndex = 0;
  
  // Регулярное выражение для поиска формул
  const formulaRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  let match;

  while ((match = formulaRegex.exec(text)) !== null) {
    // Добавляем текст до формулы
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Добавляем формулу
    const formula = match[0];
    const isDisplay = formula.startsWith('$$');
    parts.push({
      type: 'formula',
      content: formula.slice(isDisplay ? 2 : 1, -(isDisplay ? 2 : 1)),
      isDisplay
    });

    lastIndex = match.index + formula.length;
  }

  // Добавляем остаток текста
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Форматирует кодовые блоки
 */
export function extractCodeBlocks(text) {
  const parts = [];
  let lastIndex = 0;

  // Ищем кодовые блоки с тройными обратными кавычками
  const codeRegex = /```([\w]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    // Добавляем текст до блока
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Добавляем кодовый блок
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      content: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // Добавляем остаток текста
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Форматирует списки (маркированные и нумерованные)
 */
export function formatLists(text) {
  const lines = text.split('\n');
  const formatted = [];
  let inList = false;
  let listType = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Проверяем маркированный список
    const bulletMatch = line.match(/^[\s]*([-*•])\s+(.+)$/);
    // Проверяем нумерованный список
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/);

    if (bulletMatch) {
      if (!inList || listType !== 'bullet') {
        if (inList) formatted.push('</ul>');
        formatted.push('<ul>');
        inList = true;
        listType = 'bullet';
      }
      formatted.push(`<li>${bulletMatch[2]}</li>`);
    } else if (numberedMatch) {
      if (!inList || listType !== 'numbered') {
        if (inList) formatted.push('</ol>');
        formatted.push('<ol>');
        inList = true;
        listType = 'numbered';
      }
      formatted.push(`<li>${numberedMatch[2]}</li>`);
    } else {
      if (inList) {
        formatted.push(listType === 'bullet' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      if (line.trim()) {
        formatted.push(line);
      }
    }
  }

  if (inList) {
    formatted.push(listType === 'bullet' ? '</ul>' : '</ol>');
  }

  return formatted.join('\n');
}

/**
 * Основная функция обработки текста
 */
export function processMessageText(text) {
  if (!text) return '';

  // 1. Очищаем непонятные символы
  let processed = cleanText(text);

  // 2. Нормализуем переносы строк
  processed = processed
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return processed;
}

/**
 * Проверяет содержит ли текст формулы
 */
export function hasFormulas(text) {
  return /\$[\s\S]*?\$/.test(text);
}

/**
 * Проверяет содержит ли текст кодовые блоки
 */
export function hasCodeBlocks(text) {
  return /```[\s\S]*?```/.test(text);
}

/**
 * Безопасное преобразование текста в HTML (только необходимые теги)
 */
export function textToHtml(text) {
  return text
    // Экранируем HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // Форматируем жирный текст
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Форматируем курсив
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Форматируем ссылки
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
}
