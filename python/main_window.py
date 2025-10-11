# main_window.py
import sys
from PyQt5 import QtWidgets

from banner import Banner
from main_tab import MainTab
from tipes import InfoTab
from utils import resource_path


class MainWindow(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()
        self.dark_mode = False
        self.init_ui()
        self.setup_styles()

        # Баннер
        self.banner = Banner(
            parent=self,
            width=300,
            height=70,
            interval=1800000,
            images=[
                resource_path("gifs/надя.png"),
                resource_path("gifs/Реклама.png")
            ],
            links=[
                "https://t.me/+KyeTPTbdXbdmNzhi",
                "https://t.me/m3dw3d"
            ]
        )
        self.banner.move(self.width() - self.banner.width() - 10, 10)  # правый верхний угол
        self.banner.show()

    def init_ui(self):
        self.setWindowTitle("📝 Генератор ответов клиентам")
        self.setGeometry(100, 100, 800, 600)

        main_layout = QtWidgets.QVBoxLayout()
        main_layout.setContentsMargins(10, 10, 10, 10)

        header_layout = QtWidgets.QHBoxLayout()
        title_label = QtWidgets.QLabel("КЧАУ 🚗")
        title_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        self.theme_btn = QtWidgets.QPushButton("🌙")
        self.theme_btn.setFixedSize(30, 30)
        self.theme_btn.clicked.connect(self.toggle_theme)
        header_layout.addWidget(self.theme_btn)
        header_layout.addWidget(title_label)
        header_layout.addStretch()

        self.stack = QtWidgets.QStackedWidget()
        self.main_tab = MainTab(self)
        self.info_tab = InfoTab(self)
        self.stack.addWidget(self.main_tab)
        self.stack.addWidget(self.info_tab)

        main_layout.addLayout(header_layout)
        main_layout.addWidget(self.stack)
        self.setLayout(main_layout)

    def toggle_theme(self):
        self.dark_mode = not self.dark_mode
        self.setup_styles()
        self.info_tab.setup_styles()
        self.theme_btn.setText("🌞" if self.dark_mode else "🌙")

    def setup_styles(self):
        # Полностью сохранённые оригинальные стили как в твоём коде
        if self.dark_mode:
            self.setStyleSheet("""
                QWidget {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    background-color: #2b2b2b;
                    color: #f0f0f0;
                }

                QComboBox {
                    padding: 6px;
                    border: 1px solid #555;
                    border-radius: 4px;
                    background-color: #3c3f41;
                    color: #f0f0f0;
                    selection-background-color: #5D9CEC;
                    selection-color: white;
                }
                QComboBox:hover {
                    border: 1px solid #888;
                }
                QComboBox:on {
                    border: 1px solid #5D9CEC;
                }
                QComboBox::drop-down {
                    subcontrol-origin: padding;
                    subcontrol-position: top right;
                    width: 30px;
                    border-left: 1px solid #555;
                    border-top-right-radius: 4px;
                    border-bottom-right-radius: 4px;
                }
                QComboBox::down-arrow {
                    image: url(:/icons/down_arrow.svg);
                    width: 12px;
                    height: 12px;
                }
                QComboBox QAbstractItemView {
                    border: 1px solid #444;
                    background: #3c3f41;
                    selection-background-color: #5D9CEC;
                    selection-color: white;
                    outline: 0;
                    padding: 4px;
                    margin: 0;
                    min-width: 150px;
                }
                QComboBox QAbstractItemView::item {
                    padding: 4px 8px;
                    margin: 0;
                    color: #f0f0f0;
                }
                QComboBox QAbstractItemView::item:hover {
                    background-color: #505357;
                }
                QComboBox QAbstractItemView::item:selected {
                    background-color: #5D9CEC;
                    color: white;
                }

                QPushButton[text="?"], 
                QPushButton[text="←"] {
                    min-width: 30px;
                    max-width: 30px;
                    min-height: 30px;
                    max-height: 30px;
                    background-color: #1F628E;
                    color: white;
                }
                QPushButton[text="?"]:hover,
                QPushButton[text="←"]:hover {
                    background-color: #2C74A2;
                }
                QPushButton[text="?"]:pressed,
                QPushButton[text="←"]:pressed {
                    background-color: #174C6D;
                }

                QPushButton[text="🔄 Сформировать ответ"],
                QPushButton[text="📋 Скопировать результат"] {
                    background-color: #4E586E;
                    color: white;
                    width: 100%;
                    padding: 8px;
                }

                QPushButton:hover {
                    background-color: #5E6A80;
                }
                QPushButton:pressed {
                    background-color: #3D4659;
                }
                QPushButton[text="?"]:hover,
                QPushButton[text="←"]:hover {
                    background-color: #4A89DC;
                }

                QComboBox, QLineEdit, QPlainTextEdit {
                    padding: 6px;
                    border: 1px solid #555;
                    border-radius: 4px;
                    background-color: #3c3f41;
                    color: #f0f0f0;
                }
                QPlainTextEdit {
                    min-height: 100px;
                }
                QLabel {
                    font-weight: bold;
                    margin-top: 10px;
                    color: #f0f0f0;
                }
            """)
        else:
            # Оригинальная светлая тема (без изменений)
            self.setStyleSheet("""
                QWidget {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    background-color: #f5f5f5;
                }

                QComboBox {
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: white;
                    selection-background-color: #5D9CEC;
                    selection-color: white;
                }
                QComboBox:hover {
                    border: 1px solid #aaa;
                }
                QComboBox:on {
                    border: 1px solid #5D9CEC;
                }
                QComboBox::drop-down {
                    subcontrol-origin: padding;
                    subcontrol-position: top right;
                    width: 30px;
                    border-left: 1px solid #ddd;
                    border-top-right-radius: 4px;
                    border-bottom-right-radius: 4px;
                }
                QComboBox::down-arrow {
                    image: url(:/icons/down_arrow.svg);
                    width: 12px;
                    height: 12px;
                }
                QComboBox QAbstractItemView {
                    border: 1px solid #ddd;
                    background: white;
                    selection-background-color: #5D9CEC;
                    selection-color: white;
                    outline: 0;
                    padding: 4px;
                    margin: 0;
                    min-width: 150px;
                }
                QComboBox QAbstractItemView::item {
                    padding: 4px 8px;
                    margin: 0;
                }
                QComboBox QAbstractItemView::item:hover {
                    background-color: #E1E1E1;
                }
                QComboBox QAbstractItemView::item:selected {
                    background-color: #5D9CEC;
                    color: white;
                }

                QPushButton[text="?"], 
                QPushButton[text="←"] {
                    min-width: 30px;
                    max-width: 30px;
                    min-height: 30px;
                    max-height: 30px;
                    background-color: #2196F3;
                }
                QPushButton[text="?"]:hover,
                QPushButton[text="←"]:hover {
                    background-color: #1976D2;
                }
                QPushButton[text="?"]:pressed,
                QPushButton[text="←"]:pressed {
                    background-color: #0D47A1;
                }

                QPushButton[text="🔄 Сформировать ответ"],
                QPushButton[text="📋 Скопировать результат"] {
                    background-color: #4CAF50;
                    width: 100%;
                    padding: 8px;
                }

                QPushButton:hover {
                    background-color: #45a049;
                }
                QPushButton:pressed {
                    background-color: #3B7DDD;
                }
                QPushButton[text="?"]:hover,
                QPushButton[text="←"]:hover {
                    background-color: #4A89DC;
                }

                QComboBox, QLineEdit, QPlainTextEdit {
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: white;
                }
                QPlainTextEdit {
                    min-height: 100px;
                }
                QLabel {
                    font-weight: bold;
                    margin-top: 10px;
                    color: #333;
                }
            """)
