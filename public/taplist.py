#!/usr/bin/env python3
import datetime
import sys
import json
from pathlib import Path
from PyQt5 import QtWidgets, QtCore, QtGui
from typing import Union
import math
from time import strftime, localtime


class FlowLayout(QtWidgets.QLayout):
    """
    FlowLayout allows for a wrapping layout that automatically will wrap widgets to a new line if the container it is in becomes smaller
    or larger to accomodate. Essentially if the window is big enough, it will show them all on one line, else it will autowrap to new lines
    """

    def __init__(self, parent=None, margin=0, spacing=1):
        """Setup a flow layout"""
        super().__init__()
        self.setParent(parent)
        if parent is not None:
            self.setMargin(margin)
        self.setSpacing(spacing)
        # self.setAlignment(QtCore.Qt.AlignTop |QtCore.Qt.AlignLeft)
        self.itemlist = []

    def clear(self):
        for item in reversed(self.itemlist):
            item.setParent(None)

    def addItem(self, item: QtWidgets.QWidget):
        """
        Add a widget item to the flowlayout

        Args:
            item (QtWidgets.QWidget): widget to add
        """
        self.itemlist.append(item)

    def count(self) -> int:
        """How many items do we have in the layout"""
        return len(self.itemlist)

    def itemAt(self, index: int) -> Union[QtCore.QObject, None]:
        """
        Attempt to get the item at the given index

        Args:
            index (int): index to get

        Returns:
            Union[QtCore.QObject, None]: QObject else None if none found
        """
        if 0 <= index < len(self.itemlist):
            return self.itemlist[index]
        return None

    def takeAt(self, index: int) -> Union[QtCore.QObject, None]:
        """
        Remove an item from the items we track

        Args:
            index (int): index to remove

        Returns:
            Union[QtCore.QObject, None]: QObject if item found, else None
        """
        if 0 <= index < len(self.itemlist):
            return self.itemlist.pop(index)
        return None

    def expandingDirections(self):
        """Which way to expand?"""
        return QtCore.Qt.Horizontal

    def hasHeightForWidth(self):
        """How to resize, use height for width"""
        return True

    def heightForWidth(self, width: int):
        """
        set the layout of height for width based on width

        Args:
            width (int): width to use
        """
        return self.doLayout(QtCore.QRect(0, 0, width, 0), True)

    def setGeometry(self, rect: QtCore.QRect):
        """
        Set the geo size of the layout

        Args:
            rect (QtCore.QRect): rect to set geo for
        """
        super().setGeometry(rect)
        self.doLayout(rect, False)

    def sizeHint(self):
        """Get the min size hint"""
        return self.minimumSize()

    def minimumSize(self):
        """What is the min size"""
        size = QtCore.QSize()

        for item in self.itemlist:
            size = size.expandedTo(item.minimumSize())

        size += QtCore.QSize(2 * self.margin(), 2 * self.margin())
        return size

    def doLayout(self, rect, testOnly):
        """Do the layout of objects"""
        x = rect.x()
        y = rect.y()
        lineHeight = 0

        for item in self.itemlist:
            try:
                wid = item.widget()
            except:
                wid = item
            spaceX = self.spacing() + wid.style().layoutSpacing(
                QtWidgets.QSizePolicy.PushButton,
                QtWidgets.QSizePolicy.PushButton,
                QtCore.Qt.Horizontal,
            )
            spaceY = self.spacing() + wid.style().layoutSpacing(
                QtWidgets.QSizePolicy.PushButton,
                QtWidgets.QSizePolicy.PushButton,
                QtCore.Qt.Vertical,
            )
            nextX = x + item.sizeHint().width() + spaceX
            if nextX - spaceX > rect.right() and lineHeight > 0:
                x = rect.x()
                y = y + lineHeight + spaceY
                nextX = x + item.sizeHint().width() + spaceX
                lineHeight = 0

            if not testOnly:
                item.setGeometry(QtCore.QRect(QtCore.QPoint(x, y), item.sizeHint()))

            x = nextX
            lineHeight = max(lineHeight, item.sizeHint().height())

        return y + lineHeight - rect.y() + self.spacing()

    def margin(self):
        """How much margin should we have"""
        return self.getContentsMargins()[0]

    def setMargin(self, margin: int):
        """Set the margin amounts"""
        self.setContentsMargins(margin, margin, margin, margin)


class VerticalMarqueeLabel(QtWidgets.QLabel):
    def __init__(self, text="", parent=None, speed=30):
        super().__init__(parent)
        self.setAttribute(QtCore.Qt.WA_StyledBackground, True)
        self._text = text
        self.offset = 0
        self.timer = QtCore.QTimer(self)
        self.timer.timeout.connect(self.scrollText)
        self.timer.start(speed)
        self.reset_timer = QtCore.QTimer(self)
        self.reset_timer.setSingleShot(True)
        self.reset_timer.timeout.connect(self.restartScroll)
        self.setAlignment(QtCore.Qt.AlignLeft | QtCore.Qt.AlignTop)
        self.setWordWrap(True)

    def restartScroll(self):
        self.offset = 0
        self.update()
        self.timer.start()

    def setText(self, text):
        self._text = text
        self.offset = 0
        self.update()
        self.updateGeometry()

    def text(self):
        return self._text

    def scrollText(self):
        doc = QtGui.QTextDocument(self._text)
        doc.setDefaultFont(self.font())
        doc.setTextWidth(self.width())
        text_height = doc.size().height()
        if text_height <= self.height():
            self.offset = 0
            self.timer.stop()
        else:
            self.offset += 1
            # Stop when the last line is fully visible
            if self.offset >= text_height - self.height():
                self.offset = text_height - self.height()
                self.timer.stop()
                # Pause for 2 seconds (2000 ms)
                self.reset_timer.start(2000)

            self.update()

    def paintEvent(self, event):
        painter = QtGui.QPainter(self)
        # Draw background and border using style (respects QSS)
        opt = QtWidgets.QStyleOption()
        opt.initFrom(self)
        self.style().drawPrimitive(QtWidgets.QStyle.PE_Widget, opt, painter, self)

        doc = QtGui.QTextDocument(self._text)
        doc.setDefaultFont(self.font())
        doc.setTextWidth(self.width())

        # --- Set text color from palette (which QSS sets) ---
        color = self.palette().color(QtGui.QPalette.WindowText)
        default_fmt = QtGui.QTextCharFormat()
        default_fmt.setForeground(QtGui.QBrush(color))
        doc.setDefaultStyleSheet(f"body {{ color: {color.name()}; }}")  # For HTML text, optional
        cursor = QtGui.QTextCursor(doc)
        cursor.select(QtGui.QTextCursor.Document)
        cursor.setCharFormat(default_fmt)
        cursor.clearSelection()
        # ----------------------------------------------------

        painter.save()
        painter.translate(0, -self.offset)
        doc.drawContents(painter, QtCore.QRectF(0, 0, self.width(), doc.size().height()))
        painter.restore()

    def sizeHint(self):
        fm = self.fontMetrics()
        return QtCore.QSize(200, fm.height() * 2 + 10)


class Tap(QtWidgets.QFrame):
    def __init__(self, tap_data, theme, tap_list=None, width=900, height=240, parent=None):
        super().__init__(parent)
        self.tap_data = tap_data
        self.tap_list = tap_list
        self.setObjectName("TapCard")
        self.theme = theme
        self.extra_theme = self.tap_list.widget_data

        self.main_lay = QtWidgets.QHBoxLayout()

        self.layout = QtWidgets.QVBoxLayout()
        self.layout.setAlignment(QtCore.Qt.AlignTop)

        self.main_lay.setSpacing(3)
        self.main_lay.setContentsMargins(0, 0, 0, 0)
        self.main_lay.setAlignment(QtCore.Qt.AlignLeft)
        self.setLayout(self.main_lay)

        self._width = width
        self._height = height
        self.setMinimumSize(QtCore.QSize(int(self._width), int(self._height)))
        self.setMaximumSize(QtCore.QSize(int(self._width), int(self._height)))

        self.setSizePolicy(QtWidgets.QSizePolicy.Fixed, QtWidgets.QSizePolicy.Expanding)
        # widgets
        self.font_size = int(self.rem_to_px(self.tap_list.widget_data.get("font-size-body", 18)))
        self.image_size = int(
            self.extra_theme.get("imageSize", 150) * self.rem_val(self.tap_list.widget_data.get("font-size-body", 1.2))
        )

        self.icon = QtGui.QPixmap(
            f"/home/pi/taplist-server/public/{tap_data.get('labelLink', 'images/defaultImage.png')}"
        ).scaled(self.image_size, self.image_size)
        self.lab_icon = QtWidgets.QLabel()
        self.lab_icon.setPixmap(self.icon)
        self.lab_icon.setMinimumSize(self.image_size, self.image_size)

        self.lab_brewName = QtWidgets.QLabel(tap_data.get("brewName", "Unset"))
        self.lab_brewName.setWordWrap(True)

        self.lab_desc = VerticalMarqueeLabel(self.tap_data.get("description", "Order and find out!"), speed=200)
        self.lab_desc.setWordWrap(True)
        self.lab_desc.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Expanding)

        self.lab_styleAbv = QtWidgets.QLabel(f'{tap_data.get("style", "Unknown")} • {tap_data.get("abv", 0)}% ABV')
        self.lab_styleAbv.setWordWrap(True)

        if tap_data.get("category", "On Tap") != "Coming Soon":
            added_str = self.tap_list.added_dict.get(self.tap_data.get("containerType", "keg"))
        else:
            added_str = "Coming Soon: "
        dt = datetime.datetime.fromtimestamp(self.tap_data.get("dateAdded", "0") / 1000)
        formatted = dt.strftime("%d/%m/%Y")
        packaged = f"{added_str}{formatted}"
        self.lab_added = QtWidgets.QLabel(packaged)
        self.lab_added.setWordWrap(True)

        self.main_lay.addWidget(self.lab_icon, alignment=QtCore.Qt.AlignVCenter | QtCore.Qt.AlignTop)
        self.layout.addWidget(self.lab_brewName)
        self.layout.addWidget(self.lab_desc)
        self.layout.addWidget(self.lab_styleAbv)
        self.layout.addWidget(self.lab_added)
        self.main_lay.addLayout(self.layout)
        self.set_style()

    def __repr__(self):
        return f"BrewName: {self.lab_brewName.text()}"

    @property
    def category(self):
        return self.tap_data.get("category", "Unknown")

    def set_style(self):
        self.font_size = int(self.rem_to_px(self.tap_list.widget_data.get("font-size-body", 18)))
        self.image_size = int(
            self.extra_theme.get("imageSize", 150) * self.rem_val(self.tap_list.widget_data.get("font-size-body", 1.2))
        )

        if not self.icon:
            self.icon = QtGui.QPixmap(
                f"/home/pi/taplist-server/public/{self.tap_data.get('labelLink', 'images/defaultImage.png')}"
            ).scaled(self.image_size, self.image_size)
        else:
            self.icon = self.icon.scaled(self.image_size, self.image_size)
        border_radius = f"{int(self.theme.get('card-border-radius', 0)) * 16}px"
        font_family = self.theme.get("font-family", "sans-serif")
        bg_color = self.theme.get("bg-color", "#fff")
        text_color = self.theme.get("text-color", "#000")
        border_color = self.theme.get("card-border-color", "#ccc")
        self.setMaximumSize(QtCore.QSize(int(self._width), int(self._height)))
        self.setMinimumSize(QtCore.QSize(int(self._width), int(self._height)))

        self.setStyleSheet(
            f"""
            QFrame#TapCard {{
                background-color: {bg_color};
                border-radius: {border_radius};
                border: 2px solid {border_color};
                padding: 0px;
                margin:0px;
                min-width: {self._width}px;

            }}
            QLabel{{
                background:transparent;
                color: {text_color};
                font-family: {font_family};
                font-size: {self.font_size}pt;
                margin:0px;
                padding:0px;
            }}

        """
        )

    # --- THEME HANDLING ---
    def rem_to_px(self, val):
        if isinstance(val, str) and val.endswith("rem"):
            return float(val[:-3]) * 16
        return val

    def rem_val(self, val):
        if isinstance(val, str) and val.endswith("rem"):
            return float(val[:-3])
        return val


class RotatingTapList(QtWidgets.QMainWindow):
    def __init__(self, widget_data_file, screen):
        super().__init__()
        self.setWindowFlags(QtCore.Qt.FramelessWindowHint)
        self.showFullScreen()

        # hide the mouse cursor
        transparent_pixmap = QtGui.QPixmap(16, 16)
        transparent_pixmap.fill(QtCore.Qt.transparent)
        transparent_cursor = QtGui.QCursor(transparent_pixmap)
        self.setCursor(transparent_cursor)

        self.screen_size = screen.size()
        self.widget_data_file = widget_data_file
        self.widget_data = None
        self.max_shown = None
        self.all_widgets = []
        self.curr_widgets = []
        self.load_taplist_data()
        self.interval = self.widget_data.get("fadeTime", 15000)
        self.tap_width = self.widget_data.get("card-min-width", 700)
        self.theme_name = self.widget_data.get("activeTheme", "dark")
        self.theme = self.widget_data.get("themes", {}).get(self.theme_name)
        self.added_dict = {
            "can": "Canned on: ",
            "keg": "Kegged on: ",
            "bottle": "Bottled on: ",
            "growler": "Filled on: ",
        }
        self.all_widgets = []

        # Central widget and layout
        central = QtWidgets.QWidget()
        self.main_lay = QtWidgets.QVBoxLayout()
        self.main_lay.setSpacing(0)
        self.lab_taplistName = QtWidgets.QLabel(self.widget_data.get("title", "What's on Tap?"))
        self.lab_taplistName.setObjectName("LabTapListName")

        self.main_lay.addWidget(self.lab_taplistName, alignment=QtCore.Qt.AlignHCenter | QtCore.Qt.AlignTop)

        self.flow_layout = FlowLayout()
        self.main_lay.addLayout(self.flow_layout)
        self.main_lay.setSpacing(1)
        self.main_lay.setContentsMargins(0, 0, 0, 0)
        self.main_lay.setAlignment(QtCore.Qt.AlignLeft | QtCore.Qt.AlignTop)
        central.setLayout(self.main_lay)
        self.setCentralWidget(central)
        self.fade_out_group = None
        self.fade_in_group = None
        # Timer
        self.timer = QtCore.QTimer(self)
        self.timer.timeout.connect(self.next_batch)
        # File watcher
        self.file_watcher = QtCore.QFileSystemWatcher([self.widget_data_file])
        self.file_watcher.fileChanged.connect(self.on_file_changed)
        # Setup widgets
        self.setup_widgets()
        self.timer.start(self.interval)

    def load_taplist_data(self):
        """Get taplist.json data"""
        self.widget_data = json.loads(Path(self.widget_data_file).read_text())

    def rem_to_px(self, val):
        """approx rem to px values

        Args:
            val (float/int): value to convert from rem to px

        Returns:
            float: float value (if converted, else you get the str back)
        """
        if isinstance(val, str) and val.endswith("rem"):
            return float(val[:-3]) * 16
        return val

    def setup_theme(self):
        """make sure theme values are setup"""
        self.theme = self.widget_data.get("themes", {}).get(self.theme_name)
        font_family = self.theme.get("font-family", "sans-serif")
        bg_color = self.theme.get("bg-color", "#ffffff")
        text_color = self.theme.get("text-color", "#000000")
        font_size = f"{self.rem_to_px(self.widget_data.get('font-size-body', 18))}"
        padding = self.rem_to_px(self.theme.get("card-padding", "1rem"))
        self.card_gap = self.rem_to_px(self.theme.get("card-gap", "1.5rem"))
        self.header_font_size = self.rem_to_px(self.widget_data.get("font-size-header", 30))
        self.setStyleSheet(
            f"""
            QWidget {{
                background-color: {bg_color};
                color: {text_color};
                padding: {padding};
                font-family: {font_family};
                font-size:{font_size}pt;
            }}
            QLabel#LabTapListName{{
                font-size:{self.header_font_size}pt;
                margin:0,5,0,5px;
                padding:5px;
            }}
        """
        )
        self.flow_layout.setSpacing(int(self.card_gap))
        self.lab_taplistName.setText(self.widget_data.get("title", "Tap List"))

    def setup_widgets(self):
        """Create widgetse and make sure data is updated"""
        self.stop_animations()
        self.load_taplist_data()
        self.setup_theme()
        self.interval = self.widget_data.get("fadeTime", 15000)
        self.tap_width = self.widget_data.get("card-min-width", 700)
        self.theme_name = self.widget_data.get("activeTheme", "dark")
        self.theme = self.widget_data.get("themes", {}).get(self.theme_name)
        self.card_padding = self.rem_to_px(self.theme.get("card-padding", 1))
        taps = self.widget_data.get("taps", [])
        self.lab_taplistName = QtWidgets.QLabel(self.widget_data.get("title", "What's on Tap"))

        self.max_shown = None

        if self.all_widgets:
            for widget in self.all_widgets:
                widget.setVisible(False)
                widget.setParent(None)
                widget.deleteLater()

        # Create new Tap widgets
        self.all_widgets = [Tap(tap, self.theme, tap_list=self, width=self.tap_width, parent=self) for tap in taps]
        if not len(self.all_widgets):
            return

        if not self.max_shown:
            self.all_widgets[0].show()
            self.max_widgets_wide = math.floor(self.screen_size.width() / (self.all_widgets[0].width() - self.card_gap))
            self.max_widgets_high = math.floor(
                (self.screen_size.height() / (self.all_widgets[0].height() + (self.card_gap) + self.header_font_size))
            )

            self.max_shown = int(self.max_widgets_high * self.max_widgets_wide)

        # set tap widths = so they still fill screen, but could potentially have more than 2 etc. per row
        if math.floor(self.max_widgets_high) == 1:
            for wid in self.all_widgets:
                wid._width = self.screen_size.width() - 3
                wid.set_style()
        else:
            for wid in self.all_widgets:
                wid._width = (self.screen_size.width() / self.max_widgets_wide) - self.card_gap
                wid._height = (self.screen_size.height() / self.max_widgets_high) - (
                    (self.card_gap) + (self.header_font_size)
                )
                # print(wid._width, wid._height)
                wid.set_style()

        self.batch_index = 0
        self.show_current_batch()
        self.timer.setInterval(self.interval)

    def show_current_batch(self, animated=True):
        """If animating (e.g. we have more widgets than can be displayed in one screen) handle removing the
        current widgets from the flowlayout and then fade in the next ones

        Args:
            animated (bool, optional): whether we should animate or not. Defaults to True.
        """
        if not animated:
            return
        # Remove old widgets
        while self.flow_layout.count():
            item = self.flow_layout.takeAt(0)
            w = item.widget()
            if w:
                w.setParent(None)
        # Determine batch
        start = self.batch_index * self.max_shown
        end = start + self.max_shown
        self.curr_widgets = self.all_widgets[start:end]
        # If empty, cycle back
        if not self.curr_widgets:
            self.batch_index = 0
            start = 0
            end = self.max_shown
            self.curr_widgets = self.all_widgets[start:end]
        # Add with opacity 0
        for w in self.curr_widgets:
            w.setWindowOpacity(0)
            self.flow_layout.addWidget(w)
            effect = QtWidgets.QGraphicsOpacityEffect(w)
            w.setGraphicsEffect(effect)
            effect.setOpacity(0)
        # Fade in
        self.fade_in_group = QtCore.QParallelAnimationGroup(self)
        for w in self.curr_widgets:
            effect = w.graphicsEffect()
            anim = QtCore.QPropertyAnimation(effect, b"opacity")
            anim.setDuration(800)
            anim.setStartValue(0)
            anim.setEndValue(1)
            anim.setEasingCurve(QtCore.QEasingCurve.InOutQuad)
            self.fade_in_group.addAnimation(anim)
        self.fade_in_group.start()

    def next_batch(self):
        """if we have widgets, fade out current ones"""
        if not self.curr_widgets:
            return

        if len(self.all_widgets) <= self.max_shown:
            self.show_current_batch(animated=False)
            return

        self.fade_out_group = QtCore.QParallelAnimationGroup(self)
        for w in self.curr_widgets:
            effect = w.graphicsEffect()
            if not effect:
                effect = QtWidgets.QGraphicsOpacityEffect(w)
                w.setGraphicsEffect(effect)
            anim = QtCore.QPropertyAnimation(effect, b"opacity")
            anim.setDuration(800)
            anim.setStartValue(1)
            anim.setEndValue(0)
            anim.setEasingCurve(QtCore.QEasingCurve.InOutQuad)
            self.fade_out_group.addAnimation(anim)
        self.fade_out_group.finished.connect(self.on_fade_out_done)
        self.fade_out_group.start(QtCore.QAbstractAnimation.DeleteWhenStopped)

    def on_fade_out_done(self):
        # Now it is safe to remove widgets
        while self.flow_layout.count():
            item = self.flow_layout.takeAt(0)
            w = item.widget()
            if w:
                w.setParent(None)
        self.batch_index += 1
        self.fade_out_group = None
        self.show_current_batch()

    def stop_animations(self):
        if self.fade_out_group:
            self.fade_out_group.clear()
            self.fade_out_group = None
        if self.fade_in_group:
            self.fade_in_group.clear()
            self.fade_in_group = None

    def on_file_changed(self):
        self.stop_animations()
        QtCore.QTimer.singleShot(200, self.setup_widgets)


class EscapeFilter(QtCore.QObject):
    def eventFilter(self, obj, event):
        if event.type() == QtCore.QEvent.KeyPress and event.key() == QtCore.Qt.Key_Escape:
            QtWidgets.QApplication.quit()
            return True
        return super().eventFilter(obj, event)


def main():
    app = QtWidgets.QApplication(sys.argv)
    app.setOverrideCursor(QtGui.QCursor(QtCore.Qt.BlankCursor))
    escape_filter = EscapeFilter()
    app.installEventFilter(escape_filter)
    screen = app.primaryScreen()
    win = RotatingTapList("/home/pi/taplist-server/public/taplist.json", screen)
    win.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
