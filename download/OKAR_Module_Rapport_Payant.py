#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OKAR - Module Rapport Payant
Specifications Fonctionnelles, Techniques et Marketing
Style Carfax adapte a la realite africaine
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Configuration des polices
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))

registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')

styles = getSampleStyleSheet()

# Styles personnalises
cover_title = ParagraphStyle(
    name='CoverTitle',
    fontName='Microsoft YaHei',
    fontSize=32,
    leading=40,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1F4E79'),
    spaceAfter=16
)

cover_subtitle = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=16,
    leading=22,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666'),
    spaceAfter=30
)

h1_style = ParagraphStyle(
    name='H1Style',
    fontName='Microsoft YaHei',
    fontSize=18,
    leading=26,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=20,
    spaceAfter=14,
    wordWrap='CJK'
)

h2_style = ParagraphStyle(
    name='H2Style',
    fontName='Microsoft YaHei',
    fontSize=14,
    leading=20,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#2E86AB'),
    spaceBefore=16,
    spaceAfter=10,
    wordWrap='CJK'
)

h3_style = ParagraphStyle(
    name='H3Style',
    fontName='Microsoft YaHei',
    fontSize=12,
    leading=16,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    spaceBefore=12,
    spaceAfter=6,
    wordWrap='CJK'
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=10,
    leading=16,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    spaceBefore=0,
    spaceAfter=8,
    wordWrap='CJK'
)

body_indent = ParagraphStyle(
    name='BodyIndent',
    fontName='SimHei',
    fontSize=10,
    leading=16,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    leftIndent=20,
    spaceBefore=0,
    spaceAfter=6,
    wordWrap='CJK'
)

box_style = ParagraphStyle(
    name='BoxStyle',
    fontName='SimHei',
    fontSize=10,
    leading=15,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1F4E79'),
    backColor=colors.HexColor('#E8F4FD'),
    borderPadding=10,
    wordWrap='CJK'
)

bullet_style = ParagraphStyle(
    name='BulletStyle',
    fontName='SimHei',
    fontSize=10,
    leading=15,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    leftIndent=25,
    bulletIndent=12,
    spaceBefore=2,
    spaceAfter=4,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    name='CodeStyle',
    fontName='Times New Roman',
    fontSize=9,
    leading=12,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    backColor=colors.HexColor('#F5F5F5'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=6,
    spaceAfter=6,
    wordWrap='CJK'
)

wireframe_style = ParagraphStyle(
    name='WireframeStyle',
    fontName='Times New Roman',
    fontSize=8,
    leading=10,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    backColor=colors.HexColor('#FAFAFA'),
    leftIndent=5,
    rightIndent=5,
    wordWrap='CJK'
)

table_header = ParagraphStyle(
    name='TableHeader',
    fontName='Microsoft YaHei',
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.white,
    wordWrap='CJK'
)

table_cell = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    wordWrap='CJK'
)

table_cell_center = ParagraphStyle(
    name='TableCellCenter',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#333333'),
    wordWrap='CJK'
)

TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = colors.HexColor('#F5F5F5')
OKAR_ORANGE = colors.HexColor('#FF6600')
GREEN_OK = colors.HexColor('#2E7D32')
ORANGE_WARNING = colors.HexColor('#F57C00')
RED_ALERT = colors.HexColor('#C62828')

story = []

# ============================================================
# PAGE DE COUVERTURE
# ============================================================
story.append(Spacer(1, 80))
story.append(Paragraph("OKAR", cover_title))
story.append(Paragraph("Passeport Numerique Automobile", cover_subtitle))
story.append(Spacer(1, 30))
story.append(Paragraph("<b>MODULE RAPPORT PAYANT</b>", ParagraphStyle(
    name='CoverModule',
    fontName='Microsoft YaHei',
    fontSize=22,
    leading=28,
    alignment=TA_CENTER,
    textColor=OKAR_ORANGE
)))
story.append(Spacer(1, 15))
story.append(Paragraph("Recherche gratuite - Teasing - Paiement Mobile - Rapport PDF", cover_subtitle))
story.append(Spacer(1, 60))
story.append(Paragraph("Specifications Fonctionnelles, Techniques et Marketing", ParagraphStyle(
    name='CoverMeta',
    fontName='SimHei',
    fontSize=11,
    leading=16,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666')
)))
story.append(Paragraph("Style Carfax adapte a la realite africaine", ParagraphStyle(
    name='CoverMeta2',
    fontName='SimHei',
    fontSize=11,
    leading=16,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#888888')
)))
story.append(Spacer(1, 40))
story.append(Paragraph("Mars 2026", cover_subtitle))
story.append(PageBreak())

# ============================================================
# TABLE DES MATIERES
# ============================================================
story.append(Paragraph("<b>Table des Matieres</b>", h1_style))
story.append(Spacer(1, 10))

toc_items = [
    ("1. Vue d'Ensemble", "Objectifs, modele economique et valeur"),
    ("2. Parcours Utilisateur Detaille", "User Flow complet et cas limites"),
    ("3. Module de Recherche Publique", "Interface Landing Page"),
    ("4. Page Resultat Teasing", "L'appat gratuit qui cree le desir"),
    ("5. Flux de Paiement Mobile", "Orange Money / Wave integration"),
    ("6. Rapport PDF Style Carfax", "Structure et design du produit"),
    ("7. Specifications Techniques", "DB, API, securite, generation PDF"),
    ("8. Strategie Marketing", "Textes, argumentaire, pricing"),
    ("9. Exemple de Rapport", "Cas fictif Toyota Corolla 2018"),
]

for title, desc in toc_items:
    story.append(Paragraph(f"<b>{title}</b> - {desc}", body_style))

story.append(PageBreak())

# ============================================================
# 1. VUE D'ENSEMBLE
# ============================================================
story.append(Paragraph("<b>1. Vue d'Ensemble</b>", h1_style))

story.append(Paragraph("<b>1.1 Objectif Business</b>", h3_style))
story.append(Paragraph("""
Ce module transforme les donnees accumulees par OKAR en un produit revenue-generating direct. Inspire du modele Carfax americain, il permet aux acheteurs de voitures d'occasion d'acceder a l'historique complet d'un vehicule pour un montant modique de 1 000 FCFA (environ 1,50 EUR).
""", body_style))

story.append(Paragraph("<b>1.2 Modele Economique</b>", h3_style))

model_data = [
    [Paragraph('<b>Element</b>', table_header), Paragraph('<b>Description</b>', table_header), Paragraph('<b>Valeur</b>', table_header)],
    [Paragraph('Prix du rapport', table_cell), Paragraph('Montant fixe par telechargement', table_cell), Paragraph('1 000 FCFA', table_cell_center)],
    [Paragraph('Cible principale', table_cell), Paragraph('Acheteurs de voitures d\'occasion', table_cell), Paragraph('Senegal + Afrique de l\'Ouest', table_cell_center)],
    [Paragraph('Frequence d\'achat', table_cell), Paragraph('Estimee a 1-3 rapports par achat de voiture', table_cell), Paragraph('Variable', table_cell_center)],
    [Paragraph('Potentiel de revenus', table_cell), Paragraph('100 rapports/jour = 100 000 FCFA/jour', table_cell), Paragraph('3M FCFA/mois', table_cell_center)],
]

t = Table(model_data, colWidths=[4*cm, 7*cm, 3*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>1.3 Proposition de Valeur</b>", h3_style))

value_items = [
    "<b>Pour l'acheteur</b> : Evitez les arnaques pour le prix d'un sandwich. Accedez a l'historique certifie du vehicule avant d'acheter.",
    "<b>Pour OKAR</b> : Monetisation directe des donnees accumulees. Boucle de valeur qui encourage les garages a mieux documenter.",
    "<b>Pour les garages</b> : Leurs interventions certifiees prennent de la valeur commerciale. Motivation a participer a l'ecosysteme.",
    "<b>Pour les vendeurs honnetes</b> : Un rapport OKAR propre devient un argument de vente puissant."
]

for item in value_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(PageBreak())

# ============================================================
# 2. PARCOURS UTILISATEUR DETAILLE
# ============================================================
story.append(Paragraph("<b>2. Parcours Utilisateur Detaille (User Flow)</b>", h1_style))

story.append(Paragraph("<b>2.1 Flux Principal - Vehicule Trouve</b>", h2_style))

story.append(Paragraph("""
Le parcours nominal part d'un acheteur interesse par un vehicule d'occasion qui souhaite verifier son historique avant l'achat.
""", body_style))

flow_main = [
    ("Etape 1 : Arrivee sur OKAR", "L'utilisateur accede a okar.sn via Google, referral ou direct. Il voit une section 'Verifier un vehicule' sur la landing page."),
    ("Etape 2 : Saisie de l'immatriculation", "L'utilisateur entre le numero d'immatriculation (ex: DK-123-AB). Validation du format en temps reel."),
    ("Etape 3 : Recherche en base", "Le systeme interroge la base OKAR via l'index licensePlate. Retour en moins de 2 secondes."),
    ("Etape 4 : Affichage Teasing", "Le vehicule est trouve. Affichage des informations limitees avec elements floutes pour creer le desir."),
    ("Etape 5 : Decision d'achat", "L'utilisateur clique sur 'Debloquer le rapport complet - 1 000 FCFA'."),
    ("Etape 6 : Modal de paiement", "Ouverture du popup de paiement. Choix Orange Money ou Wave."),
    ("Etape 7 : Saisie telephone", "L'utilisateur entre son numero. Envoi d'une requete USSD Push vers son mobile."),
    ("Etape 8 : Validation paiement", "L'utilisateur confirme le paiement sur son mobile. Webhook receptionne par OKAR."),
    ("Etape 9 : Generation PDF", "Le rapport PDF est genere en temps reel avec les donnees completes."),
    ("Etape 10 : Telechargement", "Redirection vers la page de telechargement. Option d'envoi par email."),
]

for step, desc in flow_main:
    story.append(Paragraph(f"<b>{step}</b>", ParagraphStyle(
        name='FlowStep',
        fontName='Microsoft YaHei',
        fontSize=10,
        leading=13,
        alignment=TA_LEFT,
        textColor=OKAR_ORANGE,
        spaceBefore=8,
        spaceAfter=2,
        wordWrap='CJK'
    )))
    story.append(Paragraph(desc, body_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>2.2 Cas Limite 1 : Vehicule Non Trouve</b>", h2_style))

story.append(Paragraph("""
Lorsque l'immatriculation n'existe pas dans la base OKAR, l'experience doit rester positive et generer des opportunites business.
""", body_style))

flow_not_found = [
    ("Affichage du message", "Aucun historique OKAR trouve pour ce vehicule. Cela ne signifie pas que le vehicule a un probleme."),
    ("Opportunite business", "Proposition : Ce vehicule n'est pas encore suivi. Proposez au vendeur de faire un 'Check-up Certification' chez un garage partenaire OKAR."),
    ("Call-to-action secondaire", "Bouton 'Trouver un garage proche' qui redirige vers la carte des garages certifies."),
    ("Capture lead (optionnel)", "Formulaire : 'Soyez prevenu quand ce vehicule sera ajoute a OKAR' (email/telephone)."),
]

for step, desc in flow_not_found:
    story.append(Paragraph(f"<b>{step}</b> : {desc}", bullet_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>2.3 Cas Limite 2 : Paiement Echoue</b>", h2_style))

flow_fail = [
    ("Timeout", "Si l'utilisateur ne confirme pas dans les 3 minutes, le popup affiche : 'Session expiree. Veuillez reessayer.'"),
    ("Solde insuffisant", "Message operateur transmis : 'Solde insuffisant. Veuillez recharger et reessayer.'"),
    ("Erreur technique", "Message generique : 'Une erreur est survenue. Veuillez reessayer ou contacter le support.'"),
    ("Retry automatique", "Le systeme conserve les donnees de recherche pendant 30 minutes. L'utilisateur peut retenter sans re-saisir."),
]

for step, desc in flow_fail:
    story.append(Paragraph(f"<b>{step}</b> : {desc}", bullet_style))

story.append(PageBreak())

# ============================================================
# 3. MODULE DE RECHERCHE PUBLIQUE
# ============================================================
story.append(Paragraph("<b>3. Module de Recherche Publique (Landing Page)</b>", h1_style))

story.append(Paragraph("<b>3.1 Emplacement et Visibilite</b>", h3_style))
story.append(Paragraph("""
Le module de recherche doit etre l'element le plus visible de la landing page, au-dessus de la ligne de flottaison (above the fold). Il constitue le point d'entree principal pour les visiteurs non connectes.
""", body_style))

story.append(Paragraph("<b>3.2 Interface de Recherche</b>", h3_style))

wireframe_search = """
+------------------------------------------------------------------+
|                                                                    |
|                         [LOGO OKAR]                               |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|           Verifiez l'historique d'un vehicule                     |
|           avant d'acheter                                         |
|                                                                    |
|   +----------------------------------------------------------+   |
|   |                                                          |   |
|   |   DK-123-AB                                              |   |
|   |                                                          |   |
|   +----------------------------------------------------------+   |
|                                                                    |
|                    +------------------------+                      |
|                    |  RECHERCHER L'HISTORIQUE |                    |
|                    +------------------------+                      |
|                                                                    |
|           Ex: DK-123-AB, AA-456-CD, ZG-789-EF                     |
|           Plus de 15 000 vehicules dans notre base                |
|                                                                    |
+------------------------------------------------------------------+
"""
story.append(Paragraph(wireframe_search, wireframe_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>3.3 Validation du Format d'Immatriculation</b>", h3_style))

story.append(Paragraph("""
Le systeme doit valider le format senegalais avant d'envoyer la requete pour eviter les erreurs inutiles.
""", body_style))

format_data = [
    [Paragraph('<b>Format</b>', table_header), Paragraph('<b>Exemple</b>', table_header), Paragraph('<b>Description</b>', table_header)],
    [Paragraph('Nouveau format', table_cell), Paragraph('DK-123-AB', table_cell), Paragraph('2 lettres - 3 chiffres - 2 lettres (depuis 2018)', table_cell)],
    [Paragraph('Ancien format', table_cell), Paragraph('DK 1234', table_cell), Paragraph('2 lettres espace 4 chiffres (avant 2018)', table_cell)],
    [Paragraph('Format special', table_cell), Paragraph('CD-123-A', table_cell), Paragraph('Corps diplomatique,administration', table_cell)],
]

t = Table(format_data, colWidths=[3.5*cm, 3*cm, 8*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>3.4 Regles de Protection</b>", h3_style))

protection_items = [
    "<b>Rate limiting</b> : Maximum 5 recherches par IP par minute pour eviter le scraping.",
    "<b>CAPTCHA (optionnel)</b> : Apres 3 echecs de format, affichage d'un CAPTCHA.",
    "<b>Logging</b> : Chaque recherche est loguee (IP, immatriculation, timestamp) pour analyse."
]

for item in protection_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(PageBreak())

# ============================================================
# 4. PAGE RESULTAT TEASING
# ============================================================
story.append(Paragraph("<b>4. Page Resultat Teasing - L'Appat Gratuit</b>", h1_style))

story.append(Paragraph("<b>4.1 Philosophie du Teasing</b>", h3_style))
story.append(Paragraph("""
La page teasing est le coeur du modele economique. Elle doit donner suffisamment d'information pour rassurer l'utilisateur que le vehicule existe dans la base, mais suffisamment peu pour creer un desir intense d'en savoir plus. L'equilibre est crucial : trop d'info = pas d'achat, pas assez d'info = frustration.
""", body_style))

story.append(Paragraph("<b>4.2 Elements Visibles (Gratuits)</b>", h3_style))

visible_data = [
    [Paragraph('<b>Element</b>', table_header), Paragraph('<b>Affichage</b>', table_header), Paragraph('<b>Raison</b>', table_header)],
    [Paragraph('Marque/Modele', table_cell), Paragraph('Visible', table_cell), Paragraph('Confirmation que c\'est le bon vehicule', table_cell)],
    [Paragraph('Annee', table_cell), Paragraph('Visible', table_cell), Paragraph('Info publique, rassure sur l\'age', table_cell)],
    [Paragraph('Couleur', table_cell), Paragraph('Visible', table_cell), Paragraph('Confirmation visuelle', table_cell)],
    [Paragraph('Photo principale', table_cell), Paragraph('Visible (si dispo)', table_cell), Paragraph('Impact visuel, confiance', table_cell)],
    [Paragraph('Score OKAR', table_cell), Paragraph('Visible (numero)', table_cell), Paragraph('Accroche principale, cree la curiosite', table_cell)],
    [Paragraph('Nombre interventions', table_cell), Paragraph('Visible (compteur)', table_cell), Paragraph('Preuve de tracabilite', table_cell)],
    [Paragraph('Dernier KM', table_cell), Paragraph('Visible (XXXXX km)', table_cell), Paragraph('Donnee partielle, utile mais incomplete', table_cell)],
    [Paragraph('Nombre proprietaires', table_cell), Paragraph('Visible (X)', table_cell), Paragraph('Info cle pour acheteur', table_cell)],
    [Paragraph('Alertes majeures', table_cell), Paragraph('Visible si critique', table_cell), Paragraph('Urgence, incitation a acheter le rapport', table_cell)],
]

t = Table(visible_data, colWidths=[3.5*cm, 3.5*cm, 7.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 9), (-1, 9), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>4.3 Elements Floutes/Masques (Payants)</b>", h3_style))

blurred_data = [
    [Paragraph('<b>Element</b>', table_header), Paragraph('<b>Technique</b>', table_header), Paragraph('<b>Teasing texte</b>', table_header)],
    [Paragraph('Timeline detaillee', table_cell), Paragraph('Flou CSS + lock icon', table_cell), Paragraph('12 interventions certifiees - Debloquez pour voir', table_cell)],
    [Paragraph('Noms garages', table_cell), Paragraph('Masque complet', table_cell), Paragraph('3 garages differents - Details dans le rapport', table_cell)],
    [Paragraph('Montants factures', table_cell), Paragraph('XXXXX FCFA', table_cell), Paragraph('Total : XXX XXX FCFA - Debloquez pour details', table_cell)],
    [Paragraph('Copies factures', table_cell), Paragraph('Thumbnail grisee + lock', table_cell), Paragraph('8 factures certifiees telechargeables', table_cell)],
    [Paragraph('Courbe kilometrage', table_cell), Paragraph('Graphique flou', table_cell), Paragraph('Evolution sur 3 ans - Verifiez l\'authenticite', table_cell)],
]

t = Table(blurred_data, colWidths=[3.5*cm, 4*cm, 7*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>4.4 Wireframe Complet - Page Teasing</b>", h3_style))

wireframe_teasing = """
+------------------------------------------------------------------+
|  [OKAR]                    Resultat de recherche                  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------------------------+   TOYOTA COROLLA                  |
|  |                           |   Annee : 2018                    |
|  |      [PHOTO VEHICULE]     |   Couleur : Blanc                 |
|  |                           |   Immatriculation : DK-123-AB     |
|  +---------------------------+   VIN : JTDKN3DU...A012345       |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   SCORE OKAR                                                       |
|   +-----------------------------------------------------------+  |
|   |                    88 / 100                               |  |
|   |   [==========================]                            |  |
|   |   BON ETAT - Historique bien entretenu                    |  |
|   +-----------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   INDICATEURS CLES                                                 |
|   +-------------+  +-------------+  +-------------+               |
|   | 12          |  | 87 450 km   |  | 3           |               |
|   | Interventions|  | Dernier KM |  | Proprietaires|              |
|   | certifiees   |  | connu      |  | successifs   |              |
|   +-------------+  +-------------+  +-------------+               |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   ALERTE MAJEURE                                                   |
|   +-----------------------------------------------------------+  |
|   |  [!] CONTROLE TECHNIQUE EXPIRE - 15 Janvier 2024          |  |
|   +-----------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   HISTORIQUE (Apercu floute)                                      |
|   +-----------------------------------------------------------+  |
|   | [Lock] 12 interventions certifiees                        |  |
|   |                                                           |  |
|   | 2024-01-15 | [Garage ****] | [*******] | XXX XXX FCFA    |  |
|   | 2023-10-22 | [Garage ****] | [*******] | XX XXX FCFA     |  |
|   | 2023-07-08 | [Garage ****] | [*******] | XXX XXX FCFA    |  |
|   | ...                                                        |  |
|   +-----------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   +===========================================================+  |
|   |                                                           |  |
|   |    DEBLOQUER LE RAPPORT COMPLET - 1 000 FCFA              |  |
|   |                                                           |  |
|   |    Historique detaille, factures certifiees,              |  |
|   |    graphique kilometrage et bien plus en PDF              |  |
|   |                                                           |  |
|   +===========================================================+  |
|                                                                    |
|   Evitez les arnaques pour le prix d'un sandwich                  |
|                                                                    |
+------------------------------------------------------------------+
"""
story.append(Paragraph(wireframe_teasing, wireframe_style))

story.append(PageBreak())

# ============================================================
# 5. FLUX DE PAIEMENT MOBILE
# ============================================================
story.append(Paragraph("<b>5. Flux de Paiement Mobile</b>", h1_style))

story.append(Paragraph("<b>5.1 Choix des Operateurs</b>", h3_style))
story.append(Paragraph("""
Au Senegal, Orange Money et Wave representent plus de 95% des transactions mobile money. L'integration des deux est indispensable pour maximiser la conversion.
""", body_style))

operator_data = [
    [Paragraph('<b>Operateur</b>', table_header), Paragraph('<b>PDM Senegal</b>', table_header), Paragraph('<b>Type integration</b>', table_header)],
    [Paragraph('Orange Money', table_cell), Paragraph('55%', table_cell_center), Paragraph('API Orange + USSD Push', table_cell)],
    [Paragraph('Wave', table_cell), Paragraph('40%', table_cell_center), Paragraph('API Wave + Deep Link', table_cell)],
    [Paragraph('Wari/autres', table_cell), Paragraph('5%', table_cell_center), Paragraph('Phase 2 (non prioritaire)', table_cell)],
]

t = Table(operator_data, colWidths=[4*cm, 3*cm, 7*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>5.2 Processus de Paiement Detaille</b>", h3_style))

payment_steps = [
    ("<b>Etape 1 : Selection operateur</b>", "L'utilisateur clique sur le bouton Orange Money ou Wave. Chaque bouton affiche le logo officiel de l'operateur pour rassurer."),
    ("<b>Etape 2 : Saisie telephone</b>", "Un champ numerique accepte les formats +221 XX XXX XX XX. Validation cote client et serveur."),
    ("<b>Etape 3 : Initiation paiement</b>", "Le backend appelle l'API de l'operateur avec le montant, le numero et une reference unique."),
    ("<b>Etape 4 : USSD Push</b>", "L'operateur envoie une notification USSD sur le mobile du client qui doit confirmer avec son PIN."),
    ("<b>Etape 5 : Attente confirmation</b>", "Un loader avec compte a rebours (3 min max) affiche 'En attente de confirmation sur votre mobile...'"),
    ("<b>Etape 6 : Webhook callback</b>", "L'operateur notifie OKAR du statut final (succes/echec). Le backend met a jour la transaction."),
    ("<b>Etape 7 : Generation rapport</b>", "Si succes, le rapport PDF est genere immediatement avec un token unique de telechargement."),
    ("<b>Etape 8 : Redirection</b>", "L'utilisateur est redirige vers la page de telechargement avec le PDF pret."),
]

for step, desc in payment_steps:
    story.append(Paragraph(f"{step}", ParagraphStyle(
        name='PaymentStep',
        fontName='Microsoft YaHei',
        fontSize=10,
        leading=13,
        alignment=TA_LEFT,
        textColor=OKAR_ORANGE,
        spaceBefore=6,
        spaceAfter=2,
        wordWrap='CJK'
    )))
    story.append(Paragraph(desc, body_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.3 Wireframe - Modal de Paiement</b>", h3_style))

wireframe_payment = """
+------------------------------------------------------------------+
|                                                                    |
|                    DEBLOQUER LE RAPPORT                           |
|                         1 000 FCFA                                |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   Choisissez votre moyen de paiement :                           |
|                                                                    |
|   +------------------------+    +------------------------+       |
|   |  [ORANGE LOGO]         |    |  [WAVE LOGO]           |       |
|   |     Orange Money       |    |        Wave            |       |
|   +------------------------+    +------------------------+       |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   Votre numero de telephone :                                     |
|   +-------------------+                                           |
|   | +221 | 78 123 45 67|                                          |
|   +-------------------+                                           |
|                                                                    |
|   +===========================================================+  |
|   |                    PAYER 1 000 FCFA                       |  |
|   +===========================================================+  |
|                                                                    |
|   En confirmant, vous recevrez une demande de paiement           |
|   sur votre mobile. Veuillez avoir votre PIN pret.               |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|   [X] Fermer                                                       |
|                                                                    |
+------------------------------------------------------------------+
"""
story.append(Paragraph(wireframe_payment, wireframe_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.4 Gestion des Erreurs</b>", h3_style))

error_data = [
    [Paragraph('<b>Code erreur</b>', table_header), Paragraph('<b>Message utilisateur</b>', table_header), Paragraph('<b>Action systeme</b>', table_header)],
    [Paragraph('TIMEOUT', table_cell), Paragraph('Session expiree. Veuillez reessayer.', table_cell), Paragraph('Marquer transaction EXPIRED, liberer le token', table_cell)],
    [Paragraph('INSUFFICIENT_BALANCE', table_cell), Paragraph('Solde insuffisant. Rechargez et reessyez.', table_cell), Paragraph('Logger, proposer retry', table_cell)],
    [Paragraph('INVALID_PIN', table_cell), Paragraph('Code PIN incorrect. Reessyez.', table_cell), Paragraph('Max 3 tentatives, puis blocage 15 min', table_cell)],
    [Paragraph('NETWORK_ERROR', table_cell), Paragraph('Erreur reseau. Reessyez dans quelques instants.', table_cell), Paragraph('Retry automatique cote serveur (3x)', table_cell)],
    [Paragraph('CANCELLED', table_cell), Paragraph('Paiement annule.', table_cell), Paragraph('Marquer CANCELLED, proposer retry', table_cell)],
]

t = Table(error_data, colWidths=[3.5*cm, 5.5*cm, 5.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)

story.append(PageBreak())

# ============================================================
# 6. RAPPORT PDF STYLE CARFAX
# ============================================================
story.append(Paragraph("<b>6. Rapport PDF Style Carfax</b>", h1_style))

story.append(Paragraph("<b>6.1 Philosophie de Design</b>", h3_style))
story.append(Paragraph("""
Le rapport PDF est le produit final que l'utilisateur achete. Il doit etre visuellement impressionnant, professionnel, rassurant et facile a lire. Inspire du standard Carfax americain, il s'adapte a la realite africaine avec des elements specifiques (mobile money, reseaux sociaux, etc.).
""", body_style))

story.append(Paragraph("<b>6.2 Structure du Rapport (5 Pages)</b>", h2_style))

story.append(Paragraph("<b>Page 1 : Resume Executif</b>", h3_style))
page1_elements = [
    "<b>En-tete OKAR</b> : Logo officiel, date du rapport, ID unique de verification (ex: OKAR-2024-001234)",
    "<b>Photo du vehicule</b> : Image principale (si disponible) avec bordure premium",
    "<b>Details techniques</b> : Marque, Modele, Annee, VIN (masque partiellement), Immatriculation, Couleur, Cylindree, Carburant",
    "<b>Score de Sante OKAR</b> : Jauge graphique circulaire avec code couleur (vert/orange/rouge)",
    "<b>Tableau recapitulatif</b> : Nombre de proprietaires, Dernier entretien, Dernier KM, Statut CT, Statut Assurance",
    "<b>Badge de confiance</b> : 'Rapport genere par OKAR - Certifie par la Chambre de Metiers' (si applicable)"
]

for item in page1_elements:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Paragraph("<b>Page 2 : Timeline des Interventions</b>", h3_style))
page2_elements = [
    "<b>Frise chronologique verticale</b> : Ligne centrale avec points pour chaque intervention",
    "<b>Chaque entree contient</b> : Date, Nom du garage certifie, Type d'intervention (avec icone), Kilometrage, Couts total",
    "<b>Codage couleur</b> : Vert pour maintenance routine, Orange pour reparations, Rouge pour urgences",
    "<b>Indicateur de tendance</b> : Fleche vers le haut/bas selon l'evolution des KM entre interventions"
]

for item in page2_elements:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Paragraph("<b>Page 3 : Preuves et Factures</b>", h3_style))
page3_elements = [
    "<b>Grille de miniatures</b> : 2 colonnes avec apercu des factures uploadees",
    "<b>Chaque facture affiche</b> : Date, Garage, Montant, Badge 'Certifie OKAR'",
    "<b>Note legale</b> : 'Ces documents ont ete verifies par OKAR. En cas de doute, scannez le QR pour verifier l'authenticite.'",
    "<b>Acces haute resolution</b> : Les factures sont consultables en haute qualite via un lien unique"
]

for item in page3_elements:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Paragraph("<b>Page 4 : Analyse du Kilometrage</b>", h3_style))
page4_elements = [
    "<b>Courbe d'evolution</b> : Graphique ligne temps (X) vs kilometrage (Y)",
    "<b>Detection de fraude</b> : Si la courbe descend, ALERTE ROUGE 'Risque de falsification du compteur'",
    "<b>Moyenne annuelle</b> : Comparaison avec la moyenne nationale (15 000 km/an au Senegal)",
    "<b>Projection</b> : Estimation du KM actuel si le vehicule continue au meme rythme"
]

for item in page4_elements:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Paragraph("<b>Page 5 : Historique des Proprietaires</b>", h3_style))
page5_elements = [
    "<b>Timeline anonymisee</b> : 'Proprietaire 1 : 2018-2020 (Prive)', 'Proprietaire 2 : 2020-2022 (Societe)', etc.",
    "<b>Aucune donnee personnelle</b> : Pas de noms, adresses ou telephones",
    "<b>Indication du type</b> : Prive / Societe / Loueur / Taxi (si detectable)",
    "<b>Footer</b> : QR Code de verification du rapport + URL de verification + Contact OKAR"
]

for item in page5_elements:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>6.3 Charte Graphique du PDF</b>", h3_style))

color_data = [
    [Paragraph('<b>Element</b>', table_header), Paragraph('<b>Couleur</b>', table_header), Paragraph('<b>Usage</b>', table_header)],
    [Paragraph('Primaire OKAR', table_cell), Paragraph('#FF6600 (Orange)', table_cell), Paragraph('En-tetes, CTA, elements cles', table_cell)],
    [Paragraph('Succes/Valide', table_cell), Paragraph('#2E7D32 (Vert)', table_cell), Paragraph('Interventions OK, score eleve', table_cell)],
    [Paragraph('Attention', table_cell), Paragraph('#F57C00 (Orange)', table_cell), Paragraph('Alertes mineures, score moyen', table_cell)],
    [Paragraph('Critique', table_cell), Paragraph('#C62828 (Rouge)', table_cell), Paragraph('Alertes majeures, fraude', table_cell)],
    [Paragraph('Texte principal', table_cell), Paragraph('#333333 (Gris fonce)', table_cell), Paragraph('Paragraphes, descriptions', table_cell)],
    [Paragraph('Texte secondaire', table_cell), Paragraph('#666666 (Gris)', table_cell), Paragraph('Notes, legends', table_cell)],
    [Paragraph('Fond', table_cell), Paragraph('#FFFFFF (Blanc)', table_cell), Paragraph('Fond principal', table_cell)],
    [Paragraph('Separateurs', table_cell), Paragraph('#E0E0E0 (Gris clair)', table_cell), Paragraph('Lignes, bordures', table_cell)],
]

t = Table(color_data, colWidths=[4*cm, 4*cm, 6.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t)

story.append(PageBreak())

# ============================================================
# 7. SPECIFICATIONS TECHNIQUES
# ============================================================
story.append(Paragraph("<b>7. Specifications Techniques</b>", h1_style))

story.append(Paragraph("<b>7.1 Schema de Base de Donnees</b>", h2_style))

story.append(Paragraph("<b>Nouveau modele : VehicleReport</b>", h3_style))

schema_code = """
model VehicleReport {
  id              String   @id @default(cuid())
  vehicleId       String
  reportToken     String   @unique    // Token unique de telechargement
  transactionId   String?             // Reference paiement
  
  // Statut
  status          String   @default("PENDING")  // PENDING, PAID, EXPIRED
  
  // Donnees figees au moment de la generation
  generatedAt     DateTime @default(now())
  expiresAt       DateTime             // 30 jours par defaut
  downloadCount   Int      @default(0)
  maxDownloads    Int      @default(5)
  
  // Metadonnees
  buyerPhone      String?             // Numero de l'acheteur
  buyerEmail      String?
  paymentMethod   String?             // ORANGE_MONEY, WAVE
  paymentAmount   Float    @default(1000)
  paymentStatus   String   @default("PENDING")
  paidAt          DateTime?
  
  // PDF
  pdfUrl          String?             // Chemin du fichier genere
  pdfSize         Int?                // Taille en bytes
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  transaction     Transaction? @relation(fields: [transactionId], references: [id])
  
  @@index([vehicleId])
  @@index([reportToken])
  @@index([status])
  @@index([buyerPhone])
}
"""
story.append(Paragraph(schema_code, code_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>7.2 API Endpoints</b>", h2_style))

api_endpoints = [
    [Paragraph('<b>Endpoint</b>', table_header), Paragraph('<b>Methode</b>', table_header), Paragraph('<b>Description</b>', table_header)],
    [Paragraph('/api/public/search', table_cell), Paragraph('POST', table_cell_center), Paragraph('Recherche vehicule par immatriculation (retourne teasing)', table_cell)],
    [Paragraph('/api/reports/create', table_cell), Paragraph('POST', table_cell_center), Paragraph('Initie un rapport (genere token, montant)', table_cell)],
    [Paragraph('/api/payments/initiate', table_cell), Paragraph('POST', table_cell_center), Paragraph('Declenche le paiement mobile', table_cell)],
    [Paragraph('/api/payments/callback', table_cell), Paragraph('POST', table_cell_center), Paragraph('Webhook operateur (confirmation)', table_cell)],
    [Paragraph('/api/reports/download/:token', table_cell), Paragraph('GET', table_cell_center), Paragraph('Telecharge le PDF avec token unique', table_cell)],
    [Paragraph('/api/reports/verify/:id', table_cell), Paragraph('GET', table_cell_center), Paragraph('Verifie l\'authenticite d\'un rapport', table_cell)],
]

t = Table(api_endpoints, colWidths=[4.5*cm, 2*cm, 8*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>7.3 Generation PDF</b>", h2_style))

story.append(Paragraph("<b>Librairie recommandee : Puppeteer avec template HTML</b>", h3_style))

pdf_code = """
// Approche recommandee pour la generation PDF
// 1. Template HTML avec Tailwind CSS inline
// 2. Rendu via Puppeteer (headless Chrome)
// 3. Stockage S3/local avec CDN

async function generateVehicleReport(vehicleId: string, reportId: string) {
  // 1. Recuperer les donnees
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      maintenanceRecords: { orderBy: { interventionDate: 'desc' } },
      ownershipHistory: true,
      qrCode: true,
      photos: true
    }
  });
  
  // 2. Calculer le score OKAR
  const score = calculateHealthScore(vehicle);
  
  // 3. Generer le HTML
  const html = await renderTemplate('report-template', { vehicle, score });
  
  // 4. Convertir en PDF via Puppeteer
  const pdf = await puppeteer.page.pdf({
    format: 'A4',
    margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
    printBackground: true
  });
  
  // 5. Stocker et retourner l'URL
  const url = await storage.upload(pdf, `reports/${reportId}.pdf`);
  return url;
}
"""
story.append(Paragraph(pdf_code, code_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>7.4 Securite et Protection</b>", h2_style))

security_items = [
    "<b>Token unique</b> : Chaque achat genere un token UUID unique a usage unique",
    "<b>Limitation telechargements</b> : Maximum 5 telechargements par token (configurable)",
    "<b>Expiration</b> : Le token expire apres 30 jours",
    "<b>Rate limiting</b> : Maximum 5 rapports par telephone par 24h",
    "<b>Donnees personnelles</b> : Aucune information personnelle des proprietaires dans le rapport",
    "<b>HTTPS obligatoire</b> : Tous les echanges sont chiffres",
    "<b>Logs d'audit</b> : Chaque telechargement est logue avec IP, user-agent, timestamp"
]

for item in security_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(PageBreak())

# ============================================================
# 8. STRATEGIE MARKETING
# ============================================================
story.append(Paragraph("<b>8. Strategie Marketing</b>", h1_style))

story.append(Paragraph("<b>8.1 Textes d'Accroche</b>", h2_style))

story.append(Paragraph("<b>Bouton principal (CTA)</b>", h3_style))

cta_items = [
    '"Debloquer le rapport complet - 1 000 FCFA"',
    '"Evitez les arnaques pour le prix d\'un sandwich"',
    '"L\'historite certifie en 2 minutes, 1 000 FCFA seulement"',
    '"Achetez l\'esprit tranquille - Rapport complet OKAR"',
]

for item in cta_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Paragraph("<b>Sous-textes explicatifs</b>", h3_style))

subtitle_items = [
    '"Obtenez l\'historique detaille, les factures certifiees et le graphique de kilometrage en PDF immediat."',
    '"Plus de 15 000 vehicules dans notre base. Le votre y est peut-etre."',
    '"Rapport genere instantanement. Valable 30 jours. Telechargeable 5 fois."',
]

for item in subtitle_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>8.2 Argumentaire de Vente</b>", h2_style))

story.append(Paragraph("<b>Pourquoi ce rapport est plus fiable qu'une visite visuelle ?</b>", h3_style))

argument_items = [
    "<b>1. Donnees certifiees</b> : Chaque intervention est validee par le proprietaire du vehicule et le garage certifie OKAR. Impossible de falsifier.",
    "<b>2. Historique complet</b> : Une visite visuelle ne peut pas reveler les reparations passees, les accidents mineurs ou l'entretien neglige.",
    "<b>3. Detection de fraude</b> : Notre analyse du kilometrage detecte les inversions de compteur - impossible a voir a l'oeil nu.",
    "<b>4. Factures probantes</b> : Les factures originales sont disponibles en haute resolution. Verification croisee possible.",
    "<b>5. Garantie OKAR</b> : En cas d'erreur manifeste dans notre rapport, OKAR s'engage a indemniser jusqu'a 100 000 FCFA.",
    "<b>6. Verification QR Code</b> : Chaque rapport possede un QR Code unique pour verifier son authenticite en temps reel."
]

for item in argument_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>8.3 Objections et Reponses</b>", h2_style))

objections_data = [
    [Paragraph('<b>Objection</b>', table_header), Paragraph('<b>Reponse</b>', table_header)],
    [Paragraph('1 000 FCFA, c\'est trop cher', table_cell), Paragraph('C\'est le prix d\'un sandwich pour eviter une arnaque de plusieurs millions. Combien vaut votre tranquillite ?', table_cell)],
    [Paragraph('Je peux voir le vehicule moi-meme', table_cell), Paragraph('Une visite visuelle ne revele pas l\'historique. Notre rapport vous montre ce que le vendeur ne vous dira jamais.', table_cell)],
    [Paragraph('Le vendeur a deja un carnet d\'entretien', table_cell), Paragraph('Les carnets papier peuvent etre falsifies. Les donnees OKAR sont numerique et certifiees.', table_cell)],
    [Paragraph('Le vehicule n\'est pas dans la base', table_cell), Paragraph('Ce n\'est pas un mauvais signe ! Proposez au vendeur un Check-up Certification OKAR pour le rassurer.', table_cell)],
    [Paragraph('Je ne fais pas confiance aux apps', table_cell), Paragraph('OKAR est partenaire de la Chambre de Metiers. Chaque garage est certifie et audite regulierement.', table_cell)],
]

t = Table(objections_data, colWidths=[5*cm, 9.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)

story.append(PageBreak())

# ============================================================
# 9. EXEMPLE DE RAPPORT
# ============================================================
story.append(Paragraph("<b>9. Exemple de Rapport - Toyota Corolla 2018</b>", h1_style))

story.append(Paragraph("<b>9.1 Page 1 : Resume Executif (Exemple)</b>", h2_style))

story.append(Paragraph("""
Ci-dessous, un exemple fictif de contenu pour la section "Resume Executif" d'un rapport OKAR pour une Toyota Corolla 2018 avec un historique parfait.
""", body_style))

# Encadre Resume Executif
resume_example = """
<b>RAPPORT D'HISTORIQUE OKAR</b><br/>
Reference : OKAR-2024-007892<br/>
Date de generation : 15 Mars 2024 a 14h32<br/>
Validite : Jusqu'au 15 Avril 2024<br/><br/>

<b>VEHICULE</b><br/>
Marque : TOYOTA<br/>
Modele : Corolla<br/>
Annee : 2018<br/>
Immatriculation : DK-123-AB<br/>
VIN : JTDKN3DU***********45<br/>
Couleur : Blanc Perle<br/>
Carburant : Essence<br/>
Cylindree : 1.8L<br/><br/>

<b>SCORE DE SANTE OKAR : 88/100</b><br/>
[====================] EXCELLENT<br/>
Ce vehicule presente un historique d'entretien exemplaire. Toutes les interventions de routine ont ete effectuees dans les temps recommandes. Aucune alerte majeure detectee.<br/><br/>

<b>SYNTHESE</b><br/>
Nombre de proprietaires : 2<br/>
Dernier entretien : 12 Janvier 2024<br/>
Dernier kilometrage connu : 87 450 km<br/>
Controle technique : VALIDE (expire le 15/08/2024)<br/>
Assurance : VALIDE (expire le 20/09/2024)<br/>
Interventions OKAR : 12 certifiees<br/>
Factures disponibles : 8 documents<br/><br/>

<b>BADGES</b><br/>
[Vehicule Suivi] [Entretien Regulier] [Garantie OKAR]
"""
story.append(Paragraph(resume_example, box_style))
story.append(Spacer(1, 14))

story.append(Paragraph("<b>9.2 Page 2 : Timeline (Exemple)</b>", h2_style))

timeline_example = """
<b>HISTORIQUE DES INTERVENTIONS CERTIFIEES</b><br/><br/>

<b>2024</b><br/>
12 Janvier - Vidange complete + Filtre a huile<br/>
  Garage : Auto Plus Dakar (Certifie OKAR)<br/>
  Kilometrage : 87 450 km<br/>
  Cout : 45 000 FCFA<br/><br/>

<b>2023</b><br/>
15 Octobre - Revision freins arrieres<br/>
  Garage : Toyota Medina (Certifie OKAR)<br/>
  Kilometrage : 82 300 km<br/>
  Cout : 120 000 FCFA<br/><br/>

22 Juillet - Vidange + Controle climatisation<br/>
  Garage : Auto Plus Dakar (Certifie OKAR)<br/>
  Kilometrage : 77 100 km<br/>
  Cout : 65 000 FCFA<br/><br/>

05 Mars - Remplacement pneus avant<br/>
  Garage : Pneu Services (Partenaire OKAR)<br/>
  Kilometrage : 70 500 km<br/>
  Cout : 95 000 FCFA<br/><br/>

<b>2022</b><br/>
18 Septembre - Revision complete 60 000 km<br/>
  Garage : Toyota Medina (Certifie OKAR)<br/>
  Kilometrage : 60 200 km<br/>
  Cout : 285 000 FCFA<br/>
"""
story.append(Paragraph(timeline_example, box_style))
story.append(Spacer(1, 14))

story.append(Paragraph("<b>9.3 Page 4 : Analyse Kilometrage (Exemple)</b>", h2_style))

mileage_example = """
<b>ANALYSE DU KILOMETRAGE</b><br/><br/>

<b>Evolution sur 3 ans</b><br/>
Courbe progressive et reguliere confirmant une utilisation normale.<br/>
Aucune inversion de compteur detectee.<br/><br/>

<b>Statistiques</b><br/>
Kilometrage initial (2018) : 0 km<br/>
Kilometrage actuel : 87 450 km<br/>
Moyenne annuelle : 14 575 km/an<br/>
Moyenne nationale : 15 000 km/an<br/><br/>

<b>Conclusion</b><br/>
L'evolution du kilometrage est coherte avec l'usage declare (vehicule prive). Aucune anomalie detectee. Le compteur n'a pas ete manipule selon notre analyse.<br/><br/>

<b>PROJECTION</b><br/>
Si le rythme actuel continue :<br/>
Estimation KM fin 2024 : ~102 000 km<br/>
Estimation KM fin 2025 : ~116 500 km
"""
story.append(Paragraph(mileage_example, box_style))
story.append(Spacer(1, 14))

story.append(Paragraph("<b>9.4 Footer avec Verification QR</b>", h2_style))

footer_example = """
<b>VERIFICATION DE L'AUTHENTICITE</b><br/><br/>

Chaque rapport OKAR possede un identifiant unique verifiable en temps reel.<br/><br/>

<b>Comment verifier ce rapport ?</b><br/>
1. Scannez le QR Code ci-contre avec votre smartphone<br/>
2. Ou visitez : okar.sn/verifier/OKAR-2024-007892<br/>
3. Confirmez que le rapport est authentique et non modifie<br/><br/>

Ce rapport a ete genere le 15 Mars 2024 a 14h32.<br/>
Il est valable jusqu'au 15 Avril 2024.<br/>
Toute modification de ce document sera detectee par notre systeme.<br/><br/>

<b>OKAR - Passeport Numerique Automobile</b><br/>
Contact : support@okar.sn | +221 78 000 00 00<br/>
Partenaire de la Chambre de Metiers du Senegal
"""
story.append(Paragraph(footer_example, box_style))

story.append(PageBreak())

# ============================================================
# 10. CONCLUSION
# ============================================================
story.append(Paragraph("<b>10. Conclusion et Prochaines Etapes</b>", h1_style))

story.append(Paragraph("<b>10.1 Recommandations de Deploiement</b>", h2_style))

deployment_items = [
    "<b>Phase 1 (Semaine 1-2)</b> : Development de l'interface de recherche et de la page teasing. Tests internes.",
    "<b>Phase 2 (Semaine 3-4)</b> : Integration des APIs Orange Money et Wave en sandbox. Tests de paiement.",
    "<b>Phase 3 (Semaine 5-6)</b> : Development du generateur PDF. Creation des templates.",
    "<b>Phase 4 (Semaine 7)</b> : Beta-test avec 50 utilisateurs. Collecte feedbacks.",
    "<b>Phase 5 (Semaine 8)</b> : Lancement en production. Monitoring intensif.",
    "<b>Phase 6 (Mois 3+)</b> : Optimisation du tunnel de conversion. A/B testing des CTAs."
]

for item in deployment_items:
    story.append(Paragraph(f"- {item}", bullet_style))

story.append(Spacer(1, 12))

story.append(Paragraph("<b>10.2 Indicateurs de Succes (KPIs)</b>", h2_style))

kpi_data = [
    [Paragraph('<b>KPI</b>', table_header), Paragraph('<b>Cible</b>', table_header), Paragraph('<b>Frequence</b>', table_header)],
    [Paragraph('Taux de conversion Recherche -> Paiement', table_cell), Paragraph('&gt; 15%', table_cell_center), Paragraph('Hebdomadaire', table_cell_center)],
    [Paragraph('Nombre de rapports vendus par jour', table_cell), Paragraph('&gt; 50', table_cell_center), Paragraph('Quotidienne', table_cell_center)],
    [Paragraph('Revenu mensuel du module', table_cell), Paragraph('&gt; 1 500 000 FCFA', table_cell_center), Paragraph('Mensuelle', table_cell_center)],
    [Paragraph("Taux d'erreur paiement", table_cell), Paragraph('&lt; 5%', table_cell_center), Paragraph('Hebdomadaire', table_cell_center)],
    [Paragraph('Satisfaction client (NPS)', table_cell), Paragraph('&gt; 40', table_cell_center), Paragraph('Trimestrielle', table_cell_center)],
    [Paragraph('Recherche -> Teasing (bounce rate)', table_cell), Paragraph('&lt; 40%', table_cell_center), Paragraph('Hebdomadaire', table_cell_center)],
]

t = Table(kpi_data, colWidths=[7*cm, 3.5*cm, 4*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t)
story.append(Spacer(1, 14))

story.append(Paragraph("<b>10.3 Potentiel de Revenus</b>", h2_style))

story.append(Paragraph("""
A 1000 FCFA par rapport, le potentiel de revenus est significatif pour OKAR. Avec une base de 15 000 vehicules et une estimation conservatrice de 10% de recherches aboutissant a un achat chaque mois, le module peut generer 1 500 000 FCFA mensuels des le lancement. Ce potentiel peut doubler ou tripler avec la croissance de la base vehicules et l'amelioration du taux de conversion.
""", body_style))

# Generation du PDF
output_path = "/home/z/my-project/download/OKAR_Module_Rapport_Payant.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=1.8*cm,
    rightMargin=1.8*cm,
    topMargin=1.8*cm,
    bottomMargin=1.8*cm,
    title='OKAR_Module_Rapport_Payant',
    author='Z.ai',
    creator='Z.ai',
    subject='Specifications du module Rapport Payant - Style Carfax adapte a la realite africaine'
)

doc.build(story)
print(f"PDF genere avec succes : {output_path}")
