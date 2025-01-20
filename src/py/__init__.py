"""Installation/update of template"""

import os, codecs
from datetime import datetime
from aqt import mw, QPushButton, QMessageBox, gui_hooks
from aqt.utils import *
from aqt.qt import *
from .ankiutils import *

NC_NAME = "NotesCloze"
FNAME_FRONT = "nc-front.html"
FNAME_BACK = "nc-back.html"
FNAME_CSS = "nc.css"
ADDON_PATH = os.path.dirname(__file__)
TAG_CFG = '<!-- CONFIGURATION -->'
TAG_FUNC = '<!-- INTERNAL -->'

CVER = get_version()
NVER = "1.0.0"

#######################################################################
# Current code base
def load_files(files: tuple[str, ...]):
    out = []
    for file in files:
        with codecs.open(os.path.join(ADDON_PATH, file), encoding='utf-8') as fh:
            tmp = fh.read()
            out.append(tmp)
    return out

def backup_files(files: tuple[str, ...]):
    path = os.path.join(ADDON_PATH, 'user_files')
    os.makedirs(path, exist_ok=True)
    for file in files:
        with codecs.open(os.path.join(path, f"{file[0]}-{datetime.fromtimestamp(datetime.now().timestamp()).strftime('%Y.%m.%d-%H.%M.%S')}.bak"), mode="w", encoding='utf-8') as fh:
            fh.write(file[1])

def update_model(model, col, nfront, nback):
    msgs = []

    nfront = nfront.split(TAG_FUNC)[1].strip()
    ofront = model["tmpls"][0]["qfmt"].split(TAG_FUNC)[0].strip()
    model["tmpls"][0]["qfmt"] = fr"""{ofront}

    {TAG_FUNC}
    {nfront}
    """

    nback = nback.split(TAG_FUNC)[1].strip()
    oback = model["tmpls"][0]["afmt"].split(TAG_FUNC)[0]
    model["tmpls"][0]["afmt"] = fr"""{oback}

    {TAG_FUNC}
    {nback}
    """

    col.models.update(model)
    return msgs

def create_model(col, name, front, back, css):
    """Add model from parameters"""
    col.models.add_dict({"vers": [], "name": name, "tags": [], "did": 1, "usn": -1, "flds": [
        {"name": "Text", "media": [], "sticky": False, "rtl": False, "ord": 0,  "font": "Arial", "size": 20}
    ], "sortf":0, "tmpls": [
        {"name": NC_NAME, "qfmt": front, "did": None, "bafmt": "", "afmt": back, "ord": 0, "bqfmt": ""}
    ],
    "mod": 0, "latexPre": r"""\documentclass[12pt]{article}
    \special{papersize=3in,5in}
    \usepackage[utf8]{inputenc}
    \usepackage{amssymb,amsmath}
    \pagestyle{empty}
    \setlength{\parindent}{0in}
    \begin{document}
    """, "latexPost": r"\end{document}", "type": 1, "id": 0, "css": css})

def update():
    msgs = []
    (nfront, nback, ncss) = load_files((FNAME_FRONT, FNAME_BACK, FNAME_CSS))
    model = mw.col.models.by_name(NC_NAME)

    if not model:
        create_model(mw.col, NC_NAME, nfront, nback, ncss)
    else:
        backup_files((
            (FNAME_FRONT, model["tmpls"][0]["qfmt"]),
            (FNAME_BACK, model["tmpls"][0]["afmt"]),
            (FNAME_CSS, model["css"])
        ))
        msgs += update_model(model, mw.col, nfront, nback)

    if len(msgs) > 0:
        msg_box = QMessageBox(mw)
        msg_box.setWindowTitle('Addon "Notes cloze" updated')
        msg_box.setText("""<div style="text-align: left;">"NotesCloze" addon has been updated:<ul><li>""" + '</li><li>'.join(msgs) + """</li></ul>See the addon page for more details.</div>""")
        msg_box.addButton(QPushButton('Ok'), QMessageBox.ButtonRole.YesRole)
        msg_box.exec()

if strvercmp(CVER, NVER) < 0:
    set_version(NVER)
    gui_hooks.profile_did_open.append(update)
