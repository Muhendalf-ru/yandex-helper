from PyQt5 import QtWidgets, QtCore, QtGui


class InfoTab(QtWidgets.QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.parent = parent
        self.setup_styles()

    def setup_styles(self):
        """Применение стилей в зависимости от активной темы"""
        if hasattr(self.parent, 'dark_mode') and self.parent.dark_mode:
            # 🌙 ТЁМНАЯ ТЕМА
            self.setStyleSheet("""
                QWidget {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background-color: #2b2b2b;
                    color: #f0f0f0;
                }

                QPushButton {
                    background-color: #1E88E5;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                }
                QPushButton:hover {
                    background-color: #1565C0;
                }

                QLineEdit {
                    padding: 10px;
                    border: 2px solid #5a5a5a;
                    border-radius: 6px;
                    font-size: 14px;
                    background-color: #3c3f41;
                    color: #f0f0f0;
                }

                QGroupBox {
                    border: 2px solid #5a5a5a;
                    border-radius: 8px;
                    margin-top: 12px;
                    padding-top: 30px;
                    background-color: #3c3f41;
                }
                QGroupBox::title {
                    subcontrol-origin: margin;
                    left: 15px;
                    padding: 5px 10px;
                    color: #A6B2EC;
                    font-weight: bold;
                    font-size: 16px;
                    background-color: #2b2b2b;
                    border-radius: 4px;
                    border: 1px solid #5a5a5a;
                }

                QLabel {
                    padding: 12px;
                    font-size: 14px;
                    color: #dddddd;
                    line-height: 1.6;
                }

                QScrollBar:vertical {
                    width: 12px;
                    background: #2b2b2b;
                }
                QScrollBar::handle:vertical {
                    background: #888;
                    min-height: 30px;
                    border-radius: 6px;
                }
            """)
        else:
            # ☀️ СВЕТЛАЯ ТЕМА (оставим твой оригинальный стиль)
            self.setStyleSheet("""
                QWidget {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background-color: #f8f9fa;
                }

                QPushButton {
                    background-color: #4e73df;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                }
                QPushButton:hover {
                    background-color: #3a60d0;
                }

                QLineEdit {
                    padding: 10px;
                    border: 2px solid #d1d3e2;
                    border-radius: 6px;
                    font-size: 14px;
                    background-color: white;
                }

                QGroupBox {
                    border: 2px solid #dddfeb;
                    border-radius: 8px;
                    margin-top: 12px;
                    padding-top: 30px;
                    background-color: white;
                }
                QGroupBox::title {
                    subcontrol-origin: margin;
                    left: 15px;
                    padding: 5px 10px;
                    color: #2e59d9;
                    font-weight: bold;
                    font-size: 16px;
                    background-color: #f8f9fc;
                    border-radius: 4px;
                    border: 1px solid #d1d3e2;
                }

                QLabel {
                    padding: 12px;
                    font-size: 14px;
                    color: #5a5c69;
                    line-height: 1.6;
                }

                QScrollBar:vertical {
                    width: 12px;
                    background: #f8f9fa;
                }
                QScrollBar::handle:vertical {
                    background: #d1d3e2;
                    min-height: 30px;
                    border-radius: 6px;
                }
            """)

    def add_info_section(self, title, content):
        """Добавление секции с красивым заголовком"""
        group_box = QtWidgets.QGroupBox(title)
        group_box.setCheckable(True)
        group_box.setChecked(False)

        layout = QtWidgets.QVBoxLayout()
        label = QtWidgets.QLabel(content)
        label.setWordWrap(True)
        layout.addWidget(label)
        group_box.setLayout(layout)

        self.content_layout.addWidget(group_box)

    def filter_content(self, text):
        """Умный поиск по всем разделам"""
        search_text = text.lower().strip()

        for i in range(self.content_layout.count()):
            widget = self.content_layout.itemAt(i).widget()
            if isinstance(widget, QtWidgets.QGroupBox):
                content = widget.layout().itemAt(0).widget().text().lower()
                title = widget.title().lower()

                # Ищем в заголовке и содержимом
                match = search_text in title or search_text in content
                widget.setVisible(match)

                # Автораскрытие найденных секций
                widget.setChecked(match)