import random
import re
from PyQt5 import QtWidgets, QtCore, QtGui
from constants import TEMPLATES
from utils import parse_price_lines, format_line, sum_ruble_digits, normalize_comment, resource_path


class MainTab(QtWidgets.QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()

    def init_ui(self):
        layout = QtWidgets.QVBoxLayout(self)

        # --- выбор шаблона ---
        self.template_box = QtWidgets.QComboBox()
        self.template_box.addItems(list(TEMPLATES.keys()))
        self.template_box.currentTextChanged.connect(self.on_template_change)
        layout.addWidget(QtWidgets.QLabel("Выберите шаблон:"))
        layout.addWidget(self.template_box)

        # --- контейнер для обычных шаблонов ---
        self.common_container = QtWidgets.QWidget()
        common_layout = QtWidgets.QVBoxLayout(self.common_container)
        common_layout.addWidget(QtWidgets.QLabel("Номер заказа:"))
        self.order_input = QtWidgets.QLineEdit()
        self.order_input.setPlaceholderText("Введите номер заказа...")
        common_layout.addWidget(self.order_input)

        common_layout.addWidget(QtWidgets.QLabel("Данные о стоимости:"))
        self.price_input = QtWidgets.QPlainTextEdit()
        self.price_input.setPlaceholderText(
            "Вставьте данные о стоимости заказа здесь...\nПример:\nПодача\n100 ₽ (за 5 мин)\nВремя в пути\n200 ₽ (за 15 мин)"
        )
        common_layout.addWidget(self.price_input)

        # --- контейнер для мультизаказа ---
        self.multi_container = QtWidgets.QWidget()
        multi_layout = QtWidgets.QVBoxLayout(self.multi_container)
        multi_layout.addWidget(QtWidgets.QLabel("Данные о расчёте:"))
        self.multi_calc = QtWidgets.QPlainTextEdit()
        self.multi_calc.setPlaceholderText(
            "Вставьте данные вида:\nРасчётное расстояние\n14.99 км.\nРасчётное время\n43 мин. 4 сек."
        )
        multi_layout.addWidget(self.multi_calc)

        self.multi_done = QtWidgets.QLineEdit()
        self.multi_done.setPlaceholderText("Количество выполненных вручений")
        multi_layout.addWidget(self.multi_done)

        self.multi_total = QtWidgets.QLineEdit()
        self.multi_total.setPlaceholderText("Общее количество вручений")
        multi_layout.addWidget(self.multi_total)

        # В init_ui добавь контейнер для оплаты частями
        self.payment_container = QtWidgets.QWidget()
        payment_layout = QtWidgets.QVBoxLayout(self.payment_container)

        payment_layout.addWidget(QtWidgets.QLabel("Первое пополнение:"))
        self.payment1_input = QtWidgets.QPlainTextEdit()
        self.payment1_input.setPlaceholderText("26.09.2025, 21:19:41\n148 ₽")
        self.payment1_input.setMaximumHeight(100)
        payment_layout.addWidget(self.payment1_input)

        payment_layout.addWidget(QtWidgets.QLabel("Второе пополнение:"))
        self.payment2_input = QtWidgets.QPlainTextEdit()
        self.payment2_input.setPlaceholderText("26.09.2025, 21:34:33\n209 ₽")
        self.payment2_input.setMaximumHeight(100)
        payment_layout.addWidget(self.payment2_input)

        # --- стек контейнеров ---
        self.stack = QtWidgets.QStackedWidget()
        self.stack.addWidget(self.common_container)
        self.stack.addWidget(self.multi_container)
        self.stack.addWidget(self.payment_container)
        layout.addWidget(self.stack)

        # --- кнопка генерации ---
        self.generate_btn = QtWidgets.QPushButton("🔄 Сформировать ответ")
        self.generate_btn.clicked.connect(self.generate_result)
        layout.addWidget(self.generate_btn)

        # --- поле результата ---
        layout.addWidget(QtWidgets.QLabel("Результат:"))
        self.output = QtWidgets.QPlainTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)

        # --- Label для GIF поверх поля результата ---
        self.gif_label = QtWidgets.QLabel(self.output)
        self.gif_label.setAlignment(QtCore.Qt.AlignCenter)
        self.gif_label.setStyleSheet("background: rgba(0,0,0,0);")
        self.gif_label.hide()

        # --- кнопка копирования ---
        self.copy_btn = QtWidgets.QPushButton("📋 Скопировать результат")
        self.copy_btn.clicked.connect(self.copy_result)
        layout.addWidget(self.copy_btn)

        # --- список GIF ---
        self.gif_list = [
            resource_path("gifs/ага.gif"),
            resource_path("gifs/крыска.gif"),
            resource_path("gifs/экономика.gif"),
            resource_path("gifs/Ссыт.gif")
        ]

        # стартовая видимость
        self.on_template_change(self.template_box.currentText())

    def on_template_change(self, template_name):
        if "Отмена батча" in template_name:
            self.stack.setCurrentWidget(self.multi_container)
        elif "Оплата частями" in template_name:
            self.stack.setCurrentWidget(self.payment_container)
        else:
            self.stack.setCurrentWidget(self.common_container)

    def generate_result(self):
        try:
            template_name = self.template_box.currentText()
            template_text = TEMPLATES[template_name]

            if "Отмена батча" in template_name:
                calc_text = self.multi_calc.toPlainText()
                done = self.multi_done.text().strip()
                total = self.multi_total.text().strip()

                dist_match = re.search(r"Расч[её]тное расстояние\s*[:\-]?\s*[\r\n]*\s*([\d.,]+)\s*(км|м)\b",
                                       calc_text, re.IGNORECASE)
                distance = f"{dist_match.group(1)} {dist_match.group(2)}" if dist_match else "—"

                time_match = re.search(r"Расч[её]тное время\s*[:\-]?\s*[\r\n]*\s*(.+)", calc_text, re.IGNORECASE)
                time_raw = time_match.group(1).strip() if time_match else ""
                time_parsed = self.parse_time_to_minutes(time_raw)
                time_parsed = normalize_comment(time_parsed)

                try:
                    done_int = int(done)
                except Exception:
                    done_int = 0
                try:
                    total_int = int(total)
                except Exception:
                    total_int = 0

                def plural_word(n):
                    if 11 <= n % 100 <= 19:
                        return "вручений"
                    if n % 10 == 1:
                        return "вручение"
                    if n % 10 in (2, 3, 4):
                        return "вручения"
                    return "вручений"

                done_word = plural_word(done_int)
                diff = total_int - done_int
                if diff == 1:
                    cancel_text = "Одно из вручений было отменено, поэтому оно не вошло в расчёт, и стоимость доставки изменилась."
                elif diff > 1:
                    cancel_text = "Несколько вручений были отменены, поэтому они не были учтены при расчёте, и стоимость доставки изменилась."
                else:
                    cancel_text = "Все вручения были выполнены успешно!"

                result = template_text.format(
                    distance=distance,
                    time=time_parsed,
                    done_count=done_int,
                    done_word=done_word,
                    total_count=total_int,
                    cancel_text=cancel_text
                )
                self.output.setPlainText(result)
                return
            elif "Оплата частями" in template_name:
                # Новый 4-й шаблон
                from datetime import datetime
                MONTHS_RU = {1: "января", 2: "февраля", 3: "марта", 4: "апреля",
                             5: "мая", 6: "июня", 7: "июля", 8: "августа",
                             9: "сентября", 10: "октября", 11: "ноября", 12: "декабря"}

                def parse_payment_block(text):
                    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
                    if len(lines) < 2:
                        raise ValueError("Нужно две строки: дата/сумма")
                    dt = datetime.strptime(lines[0], '%d.%m.%Y, %H:%M:%S')
                    formatted_date = f"{dt.day} {MONTHS_RU[dt.month]} в {dt.hour:02d}:{dt.minute:02d}"
                    amount = lines[1]
                    return formatted_date, amount

                datetime1, amount1 = parse_payment_block(self.payment1_input.toPlainText())
                datetime2, amount2 = parse_payment_block(self.payment2_input.toPlainText())

                result = template_text.format(
                    amount1=amount1,
                    amount2=amount2,
                    datetime1=datetime1,
                    datetime2=datetime2
                )

                self.output.setPlainText(result)
                return

            # --- обычные шаблоны ---
            order_number = self.order_input.text().strip()
            prices = parse_price_lines(self.price_input.toPlainText())
            used_keys = set()
            body_lines = []

            ordered_fields = [
                ("Подача", "Подача"),
                ("Время в пути", "Время в пути"),
                ("Километры в пути", "Километры в пути"),
                ("Повышенный спрос", "Повышающий коэффициент"),
                ("Ожидание у отправителя", "Ожидание у отправителя"),
                ("Ожидание у получателя", "Ожидание у получателя"),
                ("Доплаты", "Бонус за заказ"),
                ("Цена отмен клиентами", "Цена отмен клиентами"),
                ("Надбавка за заказ через колл-центр", "Надбавка за заказ через колл-центр")
            ]

            extra_fields = [
                "Получение",
                "Дистанция возврата",
                "Цена платной подачи",
                "Время возврата",
                "Услуги 1 грузчика (кузов S)",
                "Услуги 1 грузчика (кузов L)",
                "Услуги 2 грузчиков (кузов XL)",
                "Услуги 1 грузчика (кузов M)",
                "Дополнительные кг",
                "Перевес более 20 кг",
                "Перевес до 10 кг",
                "Перевес 10–20 кг",
                "Девять коробок",
                "Успешный возврат посылки",
                "Компенсация парковки (30 минут)",
                "Цена отмен клиентами", "Успешное вручение посылки",
                "Время аренды"
            ]

            for key, display in ordered_fields:
                for k in prices:
                    if k.startswith(key) and k not in used_keys:
                        val, comment = prices[k]
                        body_lines.append(format_line(display, val, comment))
                        used_keys.add(k)

            for key in extra_fields:
                for k in prices:
                    if k == key and k not in used_keys:
                        val, comment = prices[k]
                        display_name = "Клиентские отмены" if key == "Цена отмен клиентами" else key
                        body_lines.append(format_line(display_name, val, comment))
                        used_keys.add(k)

            additional_services_map = {
                "От двери до двери": "От двери до двери",
                "Кузов": "Размер кузова",
                "Грузчики": "Грузчики",
                "Термокороб": "Термокороб",
                "Тяжёлая посылка": "Тяжёлая посылка",
            }

            for key, (val, comment) in prices.items():
                if "Кузов" in key:
                    name = 'Дополнительные услуги «Размер кузова»'
                    body_lines.append(format_line(name, val, comment))
                    used_keys.add(key)
                    continue
                for k in additional_services_map:
                    if k.lower() != "кузов" and k.lower() in key.lower():
                        name = f'Дополнительные услуги «{additional_services_map[k]}»'
                        body_lines.append(format_line(name, val, comment))
                        used_keys.add(key)
                        break

            body_text = "\n".join(body_lines)
            temp_result = template_text.format(
                order_number=order_number,
                body=body_text,
                total="TEMP_TOTAL"
            )
            calculated_total = sum_ruble_digits(temp_result)
            result = temp_result.replace("TEMP_TOTAL", calculated_total)
            self.output.setPlainText(result)

        except Exception as e:
            QtWidgets.QMessageBox.critical(self, "Ошибка", f"Произошла ошибка при обработке данных:\n{str(e)}")

    def parse_time_to_minutes(self, text):
        h = re.search(r"(\d+)\s*ч", text)
        m = re.search(r"(\d+)\s*мин", text)
        if h and m:
            result = f"{h.group(1)} ч {m.group(1)} мин"
        elif m:
            result = f"{m.group(1)} мин"
        elif h:
            result = f"{h.group(1)} ч"
        else:
            result = text
        return normalize_comment(result)

    def copy_result(self):
        # Копируем текст результата в буфер обмена
        clipboard = QtWidgets.QApplication.clipboard()
        clipboard.setText(self.output.toPlainText())
        self.copy_btn.setText("✅ Скопировано!")
        QtCore.QTimer.singleShot(2000, lambda: self.copy_btn.setText("📋 Скопировать результат"))

        # Показываем случайную GIF на 5 секунд
        random_gif = random.choice(self.gif_list)
        movie = QtGui.QMovie(random_gif)

        # Подгоняем размер под поле результата, сохраняя пропорции
        output_size = self.output.size()
        movie.setScaledSize(output_size)

        self.gif_label.setMovie(movie)
        self.gif_label.setFixedSize(output_size)  # Лейбл занимает размер поля результата
        self.gif_label.setAlignment(QtCore.Qt.AlignCenter)
        self.gif_label.show()
        movie.start()

        # Скрываем GIF через 5 секунд
        QtCore.QTimer.singleShot(5000, lambda: self.gif_label.hide())

        # --- Очистка полей в зависимости от текущего видимого контейнера ---
        current = self.stack.currentWidget()

        if current == self.common_container:
            self.order_input.clear()
            self.price_input.clear()
        elif current == self.multi_container:
            self.multi_calc.clear()
            self.multi_done.clear()
            self.multi_total.clear()
        elif current == self.payment_container:
            self.payment1_input.clear()
            self.payment2_input.clear()

        # Очищаем поле результата
        self.output.clear()


