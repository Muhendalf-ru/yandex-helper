# work.py
import sys
import os
from PyQt5 import QtWidgets
from main_window import MainWindow

if getattr(sys, 'frozen', False):
    os.chdir(sys._MEIPASS)

if __name__ == '__main__':
    app = QtWidgets.QApplication(sys.argv)
    app.setStyle("Fusion")
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())