// InfoTab.tsx - точная копия логики из Python tipes.py
import React, { useState } from 'react';

interface InfoTabProps {
  darkMode: boolean;
}

const InfoTab: React.FC<InfoTabProps> = ({ darkMode }) => {
  const [searchText, setSearchText] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const infoSections = [
    {
      id: 'general',
      title: 'Общая информация',
      content: `Этот генератор ответов клиентам поможет вам быстро создавать стандартные ответы на типичные вопросы о стоимости заказов.

Основные функции:
• Генерация ответов по готовым шаблонам
• Автоматический расчёт итоговой стоимости
• Поддержка различных типов заказов
• Копирование результата в буфер обмена`,
    },
    {
      id: 'templates',
      title: 'Шаблоны ответов',
      content: `Доступные шаблоны:

1. Шаблон 1 (РВ) - стандартный ответ с проверкой заказа
2. Шаблон 2 (Подробно) - подробное объяснение стоимости
3. Шаблон 3 (Отмена батча) - для мультизаказов
4. Шаблон 4 (Оплата частями) - для частичных платежей

Каждый шаблон автоматически подставляет данные и рассчитывает итоговую стоимость.`,
    },
    {
      id: 'usage',
      title: 'Как использовать',
      content: `1. Выберите подходящий шаблон из выпадающего списка
2. Заполните необходимые поля:
   • Для обычных шаблонов: номер заказа и данные о стоимости
   • Для мультизаказов: данные о расчёте и количество вручений
   • Для оплаты частями: данные о двух пополнениях
3. Нажмите "Сформировать ответ"
4. Скопируйте результат кнопкой "Скопировать результат"`,
    },
    {
      id: 'data_format',
      title: 'Формат данных',
      content: `Данные о стоимости вводите в следующем формате:

Подача
50 ₽ (7.55 км)
Время в пути
271 ₽ (Повышенный спрос)
Километры в пути
55 ₽ (13 мин 44 сек)

Каждая строка с ценой должна содержать сумму в рублях (₽) и опциональный комментарий в скобках.`,
    },
    {
      id: 'troubleshooting',
      title: 'Решение проблем',
      content: `Частые проблемы и их решения:

• Неправильный формат данных - убедитесь, что цены указаны с символом ₽
• Неверный расчёт итоговой суммы - проверьте правильность введённых данных
• Ошибка при парсинге - убедитесь, что данные разделены переносами строк
• Проблемы с копированием - проверьте разрешения браузера на доступ к буферу обмена`,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const filterContent = (text: string) => {
    const searchText = text.toLowerCase().trim();
    setSearchText(searchText);

    // Автоматически раскрываем найденные секции
    const newExpanded: { [key: string]: boolean } = {};
    infoSections.forEach((section) => {
      const titleMatch = section.title.toLowerCase().includes(searchText);
      const contentMatch = section.content.toLowerCase().includes(searchText);
      if (titleMatch || contentMatch) {
        newExpanded[section.id] = true;
      }
    });
    setExpandedSections((prev) => ({ ...prev, ...newExpanded }));
  };

  const filteredSections = infoSections.filter((section) => {
    if (!searchText) return true;
    const titleMatch = section.title.toLowerCase().includes(searchText);
    const contentMatch = section.content.toLowerCase().includes(searchText);
    return titleMatch || contentMatch;
  });

  return (
    <div className={`info-tab ${darkMode ? 'dark' : 'light'}`}>
      <div className="info-header">
        <h2>📚 Справочная информация</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск по разделам..."
            value={searchText}
            onChange={(e) => filterContent(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="info-content">
        {filteredSections.map((section) => (
          <div key={section.id} className="info-section">
            <button
              className={`section-header ${expandedSections[section.id] ? 'expanded' : ''}`}
              onClick={() => toggleSection(section.id)}>
              <span className="section-title">{section.title}</span>
              <span className="section-toggle">{expandedSections[section.id] ? '▼' : '▶'}</span>
            </button>

            {expandedSections[section.id] && (
              <div className="section-content">
                <div className="section-text">
                  {section.content.split('\n').map((line, index) => (
                    <div key={index} className="content-line">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoTab;
