import { useState } from 'react';
import './App.css';
import { TEMPLATES } from './constants';
import {
  parsePriceLines,
  formatLine,
  sumRubleDigits,
  normalizeComment,
  parseTimeToMinutes,
  pluralWord,
  parsePaymentBlock,
} from './utils';
import InfoTab from './InfoTab';

type TemplateType = 'common' | 'multi' | 'payment' | 'inflow';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Шаблон 1 (РВ)');
  const [darkMode, setDarkMode] = useState(false);
  const [currentTab, setCurrentTab] = useState<'main' | 'info' | 'inflow'>('main');

  // Общие поля
  const [orderNumber, setOrderNumber] = useState('');
  const [priceData, setPriceData] = useState('');

  // Поля для мультизаказа
  const [multiCalc, setMultiCalc] = useState('');
  const [multiDone, setMultiDone] = useState('');
  const [multiTotal, setMultiTotal] = useState('');

  // Поля для оплаты частями
  const [payment1, setPayment1] = useState('');
  const [payment2, setPayment2] = useState('');

  const [result, setResult] = useState('');
  const [showGif, setShowGif] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('📋 Скопировать результат');
  const [currentGif, setCurrentGif] = useState('');

  // Fields for inflow tab
  const [inflowAmount, setInflowAmount] = useState('');
  const [inflowDate, setInflowDate] = useState('');
  const [inflowTime, setInflowTime] = useState('');

  const getCurrentTemplateType = (): TemplateType => {
    if (selectedTemplate.includes('Отмена батча')) return 'multi';
    if (selectedTemplate.includes('Оплата частями')) return 'payment';
    if (selectedTemplate.includes('Поступление')) return 'inflow';
    return 'common';
  };

  const generateResult = () => {
    try {
      const templateText = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES];
      if (!templateText) {
        alert('Выбранный шаблон не найден');
        return;
      }

      const templateType = getCurrentTemplateType();

      if (templateType === 'multi') {
        // Валидация для мультизаказа
        if (!multiCalc.trim()) {
          alert('Пожалуйста, введите данные о расчёте');
          return;
        }
        if (!multiDone.trim() || !multiTotal.trim()) {
          alert('Пожалуйста, введите количество выполненных и общее количество вручений');
          return;
        }

        // Логика для мультизаказа
        // Robust distance parsing: try to find a number + km/m anywhere first,
        // otherwise look for a value directly below the label "Расчётное расстояние".
        let distance = '—';
        // tolerate formats like "4.60 км." or "4,60км" and trailing punctuation
        const dm = multiCalc.match(/([\d.,]+)\s*[\u00A0\s]*?(км|м)\.?/i);
        if (dm) {
          const num = dm[1].trim();
          const unit = dm[2].trim();
          distance = `${num} ${unit}`;
        } else {
          const dm2 = multiCalc.match(
            /Расч[её]тное расстояние[\s:\-]*[\r\n]+\s*([\d.,]+)\s*[\u00A0\s]*?(км|м)\.?/i,
          );
          if (dm2) {
            const num = dm2[1].trim();
            const unit = dm2[2].trim();
            distance = `${num} ${unit}`;
          }
        }

        // Robust time parsing: capture the line after the label if necessary,
        // then normalize via parseTimeToMinutes.
        let timeRaw = '';
        const tmInline = multiCalc.match(/(\d+\s*ч(?:\.|)|\d+\s*мин(?:\.|)|\d+\s*сек(?:\.|))/i);
        if (tmInline) {
          // prefer a direct occurrence of hours/minutes/seconds
          timeRaw = tmInline[0];
        } else {
          const tm = multiCalc.match(/Расч[её]тное время[\s:\-]*[\r\n]+\s*([^\r\n]+)/i);
          if (tm) timeRaw = tm[1].trim();
        }

        const timeParsed = normalizeComment(parseTimeToMinutes(timeRaw));

        const doneInt = parseInt(multiDone) || 0;
        const totalInt = parseInt(multiTotal) || 0;
        const doneWord = pluralWord(doneInt);

        const diff = totalInt - doneInt;
        let cancelText = '';
        if (diff === 1) {
          cancelText =
            'Одно из вручений было отменено, поэтому оно не вошло в расчёт, и стоимость доставки изменилась.';
        } else if (diff > 1) {
          cancelText =
            'Несколько вручений были отменены, поэтому они не были учтены при расчёте, и стоимость доставки изменилась.';
        } else {
          cancelText = 'Все вручения были выполнены успешно!';
        }

        const result = templateText
          .replace('{distance}', distance)
          .replace('{time}', timeParsed)
          .replace('{done_count}', doneInt.toString())
          .replace('{done_word}', doneWord)
          .replace('{total_count}', totalInt.toString())
          .replace('{cancel_text}', cancelText);

        setResult(result);
        return;
      }

      if (templateType === 'payment') {
        // Валидация для оплаты частями
        if (!payment1.trim() || !payment2.trim()) {
          alert('Пожалуйста, введите данные для обоих пополнений');
          return;
        }

        // Логика для оплаты частями
        const { formattedDate: datetime1, amount: amount1 } = parsePaymentBlock(payment1);
        const { formattedDate: datetime2, amount: amount2 } = parsePaymentBlock(payment2);

        const result = templateText
          .replace('{amount1}', amount1)
          .replace('{amount2}', amount2)
          .replace('{datetime1}', datetime1)
          .replace('{datetime2}', datetime2);

        setResult(result);
        return;
      }

      // Special: inflow tab generates its own text (not template-based)
      if (templateType === 'inflow') {
        if (!inflowAmount.trim() || !inflowDate.trim() || !inflowTime.trim()) {
          alert('Пожалуйста, заполните сумму, дату и время поступления');
          return;
        }
        const resultText = templateText
          .replace('{inflow_amount}', inflowAmount)
          .replace('{inflow_date}', inflowDate)
          .replace('{inflow_time}', inflowTime);
        setResult(resultText);
        return;
      }

      // Валидация для обычных шаблонов
      if (!orderNumber.trim()) {
        alert('Пожалуйста, введите номер заказа');
        return;
      }
      if (!priceData.trim()) {
        alert('Пожалуйста, введите данные о стоимости');
        return;
      }

      // Логика для обычных шаблонов
      const prices = parsePriceLines(priceData);
      const usedKeys = new Set<string>();
      const bodyLines: string[] = [];

      // Точная копия логики из Python main_tab.py
      const orderedFields = [
        ['Подача', 'Подача'],
        ['Время в пути', 'Время в пути'],
        ['Километры в пути', 'Километры в пути'],
        ['Повышенный спрос', 'Повышающий коэффициент'],
        ['Ожидание у отправителя', 'Ожидание у отправителя'],
        ['Ожидание у получателя', 'Ожидание у получателя'],
        ['Доплаты', 'Бонус за заказ'],
        ['Цена отмен клиентами', 'Цена отмен клиентами'],
        ['Надбавка за заказ через колл-центр', 'Надбавка за заказ через колл-центр'],
      ];

      const extraFields = [
        'Получение',
        'Дистанция возврата',
        'Цена платной подачи',
        'Время возврата',
        'Услуги 1 грузчика (кузов S)',
        'Услуги 1 грузчика (кузов L)',
        'Услуги 2 грузчиков (кузов XL)',
        'Услуги 1 грузчика (кузов M)',
        'Услуги 2 грузчиков (кузов L)',
        'Дополнительные кг',
        'Перевес более 20 кг',
        'Перевес до 10 кг',
        'Перевес 10–20 кг',
        'Девять коробок',
        'Успешный возврат посылки',
        'Компенсация парковки (30 минут)',
        'Цена отмен клиентами',
        'Успешное вручение посылки',
        'Время аренды',
      ];

      // Обработка упорядоченных полей
      for (const [key, display] of orderedFields) {
        for (const k in prices) {
          if (k.startsWith(key) && !usedKeys.has(k)) {
            const [val, comment] = prices[k];
            bodyLines.push(formatLine(display, val, comment));
            usedKeys.add(k);
          }
        }
      }

      // Обработка дополнительных полей
      for (const key of extraFields) {
        for (const k in prices) {
          if (k === key && !usedKeys.has(k)) {
            const [val, comment] = prices[k];
            const displayName = key === 'Цена отмен клиентами' ? 'Клиентские отмены' : key;
            bodyLines.push(formatLine(displayName, val, comment));
            usedKeys.add(k);
          }
        }
      }

      // Точная копия логики обработки дополнительных услуг из Python
      const additionalServicesMap: { [key: string]: string } = {
        'От двери до двери': 'От двери до двери',
        Кузов: 'Размер кузова',
        Грузчики: 'Грузчики',
        Термокороб: 'Термокороб',
        'Тяжёлая посылка': 'Тяжёлая посылка',
      };

      for (const key in prices) {
        if (key.includes('Кузов')) {
          const [val, comment] = prices[key];
          bodyLines.push(formatLine('Дополнительные услуги «Размер кузова»', val, comment));
          usedKeys.add(key);
          continue;
        }
        for (const k in additionalServicesMap) {
          if (k.toLowerCase() !== 'кузов' && key.toLowerCase().includes(k.toLowerCase())) {
            const [val, comment] = prices[key];
            const name = `Дополнительные услуги «${additionalServicesMap[k]}»`;
            bodyLines.push(formatLine(name, val, comment));
            usedKeys.add(key);
            break;
          }
        }
      }

      const bodyText = bodyLines.join('\n');
      const tempResult = templateText
        .replace('{order_number}', orderNumber)
        .replace('{body}', bodyText)
        .replace('{total}', 'TEMP_TOTAL');

      const calculatedTotal = sumRubleDigits(tempResult);
      const finalResult = tempResult.replace('TEMP_TOTAL', calculatedTotal);

      setResult(finalResult);
    } catch (error) {
      alert(`Произошла ошибка при обработке данных: ${error}`);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopyButtonText('✅ Скопировано!');

    // Показываем картинку вместо эмоджи
    setCurrentGif('/yandex-helper/medved.jpg');
    setShowGif(true);

    setTimeout(() => {
      setShowGif(false);
      setCopyButtonText('📋 Скопировать результат');
    }, 2000);

    // Очистка полей
    const templateType = getCurrentTemplateType();
    if (templateType === 'common') {
      setOrderNumber('');
      setPriceData('');
    } else if (templateType === 'multi') {
      setMultiCalc('');
      setMultiDone('');
      setMultiTotal('');
    } else if (templateType === 'payment') {
      setPayment1('');
      setPayment2('');
    } else if (templateType === 'inflow') {
      setInflowAmount('');
      setInflowDate('');
      setInflowTime('');
    }
    setResult('');
  };

  const renderCommonForm = () => (
    <div className="form-section">
      <label>Номер заказа:</label>
      <input
        type="text"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Введите номер заказа..."
      />

      <label>Данные о стоимости:</label>
      <textarea
        value={priceData}
        onChange={(e) => setPriceData(e.target.value)}
        placeholder="Вставьте данные о стоимости заказа здесь...&#10;Пример:&#10;Подача&#10;100 ₽ (за 5 мин)&#10;Время в пути&#10;200 ₽ (за 15 мин)"
        rows={6}
      />
    </div>
  );

  const renderMultiForm = () => (
    <div className="form-section">
      <label>Данные о расчёте:</label>
      <textarea
        value={multiCalc}
        onChange={(e) => setMultiCalc(e.target.value)}
        placeholder="Вставьте данные вида:&#10;Расчётное расстояние&#10;14.99 км.&#10;Расчётное время&#10;43 мин. 4 сек."
        rows={4}
      />

      <input
        type="text"
        value={multiDone}
        onChange={(e) => setMultiDone(e.target.value)}
        placeholder="Количество выполненных вручений"
      />

      <input
        type="text"
        value={multiTotal}
        onChange={(e) => setMultiTotal(e.target.value)}
        placeholder="Общее количество вручений"
      />
    </div>
  );

  const renderPaymentForm = () => (
    <div className="form-section">
      <label>Первое пополнение:</label>
      <textarea
        value={payment1}
        onChange={(e) => setPayment1(e.target.value)}
        placeholder="26.09.2025, 21:19:41&#10;148 ₽"
        rows={2}
      />

      <label>Второе пополнение:</label>
      <textarea
        value={payment2}
        onChange={(e) => setPayment2(e.target.value)}
        placeholder="26.09.2025, 21:34:33&#10;209 ₽"
        rows={2}
      />
    </div>
  );

  const renderInflowForm = () => (
    <div className="form-section">
      <label>Сумма заказа (руб):</label>
      <input
        type="text"
        value={inflowAmount}
        onChange={(e) => setInflowAmount(e.target.value)}
        placeholder="Например: 148"
      />

      <label>Дата поступления:</label>
      <input
        type="text"
        value={inflowDate}
        onChange={(e) => setInflowDate(e.target.value)}
        title="Дата поступления (например: 12 сентября 2025)"
        placeholder="12 сентября 2025"
      />

      <label>Время поступления:</label>
      <input
        type="time"
        value={inflowTime}
        onChange={(e) => setInflowTime(e.target.value)}
        title="Время поступления"
        placeholder="чч:мм"
      />
    </div>
  );

  return (
    <div className={`app ${darkMode ? 'light' : 'dark'}`}>
      <header className="header">
        <div className="header-left">
          <img src="/yandex-helper/medved.jpg" alt="gay-medved" className="medved-png" />
          <h1>Yandex Fisting Helper</h1>
          <div className="tab-buttons">
            <button
              className={`tab-btn ${currentTab === 'main' ? 'active' : ''}`}
              onClick={() => setCurrentTab('main')}>
              📝 Генератор
            </button>
            <button
              className={`tab-btn ${currentTab === 'info' ? 'active' : ''}`}
              onClick={() => setCurrentTab('info')}>
              Справка
            </button>
          </div>
        </div>
        <div className="header-right">
          <div>
            <h4>москва, подмосковье- 7% Остальное 10%(Термокороб комса)</h4>
          </div>
          {/* <div className="mini-ad mini-ad-left">
            <div className="ad-text">
              <a
                className="ad-link"
                href="https://t.me/+KyeTPTbdXbdmNzhi"
                target="_blank"
                rel="noopener noreferrer">
                Лучший художник мужского достоинства
              </a>
            </div>
            <a
              href="https://t.me/+KyeTPTbdXbdmNzhi"
              title="Лучший художник мужского достоинства"
              target="_blank"
              rel="noopener noreferrer">
              <img src="/yandex-helper/lemon.jpg" alt="femboy" />
            </a>
          </div> */}
          {/* <div className="mini-ad">
            <a
              className="ad-img-link"
              href="https://store.steampowered.com/app/3602290/FEMBOY_FUTA_HOUSE/"
              target="_blank"
              rel="noopener noreferrer">
              <img
                src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3602290/6385a10d2c3f15d06559ee06a59891960483708d/header_russian.jpg?t=1759777159"
                alt="Poster"
              />
            </a>
            <div className="ad-text">
              Помогло приложение? Купи мне
              <br />
              <a
                className="ad-cta"
                href="https://store.steampowered.com/app/3602290/FEMBOY_FUTA_HOUSE/"
                target="_blank"
                rel="noopener noreferrer">
                Femboy Futa House
              </a>
            </div>
          </div> */}
          <button
            className="download-btn"
            onClick={async () => {
              try {
                // Query GitHub API for latest release assets
                const apiUrl =
                  'https://api.github.com/repos/Muhendalf-ru/yandex-helper/releases/latest';
                const res = await fetch(apiUrl, {
                  headers: { Accept: 'application/vnd.github+json' },
                });
                if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
                const data = await res.json();
                // Find the first asset that ends with .exe (case-insensitive)
                const exeAsset = (data.assets || []).find(
                  (a: any) => a.name && a.name.toLowerCase().endsWith('.exe'),
                );
                if (exeAsset && exeAsset.browser_download_url) {
                  window.open(exeAsset.browser_download_url, '_blank', 'noopener');
                } else {
                  // fallback: open releases page
                  window.open(
                    'https://github.com/Muhendalf-ru/yandex-helper/releases/latest',
                    '_blank',
                    'noopener',
                  );
                }
              } catch (err) {
                console.error(err);
                window.open(
                  'https://github.com/Muhendalf-ru/yandex-helper/releases/latest',
                  '_blank',
                  'noopener',
                );
              }
            }}>
            ⬇️ Скачать на пк
          </button>

          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      {/* Гарландa под хедером (во всю ширину) */}
      {/* <div className="garland-wrap">
        <img src="/yandex-helper/winter-balls.png" alt="Гирлянда" className="garland" />
      </div> */}

      {/* Снежинки (поверх контента, под шапкой) */}
      {/* <div className="snowflakes" aria-hidden="true">
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
      </div> */}
      {currentTab === 'main' ? (
        <main className="main" key="main">
          <div className="template-selector">
            <label>Выберите шаблон:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              aria-label="Выберите шаблон">
              {Object.keys(TEMPLATES).map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>

          {getCurrentTemplateType() === 'common' ? (
            <div className="split-row">
              {renderCommonForm()}

              <div className="result-section">
                <label>Результат:</label>
                <div className="result-container">
                  <textarea
                    value={result}
                    readOnly
                    className="result-textarea"
                    aria-label="Результат генерации"
                  />
                  {showGif && (
                    <div className="gif-overlay">
                      <img src={currentGif} alt="medved" className="gif-image" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : getCurrentTemplateType() === 'multi' ? (
            <div className="split-row">
              {renderMultiForm()}
              <div className="result-section">
                <label>Результат:</label>
                <div className="result-container">
                  <textarea
                    value={result}
                    readOnly
                    className="result-textarea"
                    aria-label="Результат генерации"
                  />
                  {showGif && (
                    <div className="gif-overlay">
                      <img src={currentGif} alt="medved" className="gif-image" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : getCurrentTemplateType() === 'inflow' ? (
            <div className="split-row">
              {renderInflowForm()}
              <div className="result-section">
                <label>Результат:</label>
                <div className="result-container">
                  <textarea
                    value={result}
                    readOnly
                    className="result-textarea"
                    aria-label="Результат генерации"
                  />
                  {showGif && (
                    <div className="gif-overlay">
                      <img src={currentGif} alt="medved" className="gif-image" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="split-row">
              {renderPaymentForm()}
              <div className="result-section">
                <label>Результат:</label>
                <div className="result-container">
                  <textarea
                    value={result}
                    readOnly
                    className="result-textarea"
                    aria-label="Результат генерации"
                  />
                  {showGif && (
                    <div className="gif-overlay">
                      <div className="gif-placeholder">{currentGif}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button className="generate-btn" onClick={generateResult}>
            🔄 Сформировать ответ
          </button>

          <button className="copy-btn" onClick={copyResult}>
            {copyButtonText}
          </button>
        </main>
      ) : currentTab === 'inflow' ? (
        <main className="main" key="inflow">
          <div className="form-section">
            <label>Сумма заказа (руб):</label>
            <input
              type="text"
              value={inflowAmount}
              onChange={(e) => setInflowAmount(e.target.value)}
              placeholder="Например: 148"
            />

            <label>Дата поступления:</label>
            <input
              type="date"
              value={inflowDate}
              onChange={(e) => setInflowDate(e.target.value)}
              title="Дата поступления"
              placeholder="гггг-мм-дд"
            />

            <label>Время поступления:</label>
            <input
              type="time"
              value={inflowTime}
              onChange={(e) => setInflowTime(e.target.value)}
              title="Время поступления"
              placeholder="чч:мм"
            />
          </div>

          <div className="result-section">
            <label>Результат:</label>
            <div className="result-container">
              <textarea
                value={result}
                readOnly
                className="result-textarea"
                aria-label="Результат генерации"
              />
            </div>
          </div>

          <button className="generate-btn" onClick={generateResult}>
            🔄 Сформировать ответ
          </button>

          <button className="copy-btn" onClick={copyResult}>
            {copyButtonText}
          </button>
        </main>
      ) : (
        <InfoTab darkMode={darkMode} key="info" />
      )}
    </div>
  );
}

export default App;
