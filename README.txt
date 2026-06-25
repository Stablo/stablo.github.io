Villisika-Sepon juomapeli — versio 0.4.13-talousindeksi

Avaa index.html selaimessa.

Uutta tässä versiossa:
- Lisätty Talous-järjestelmä Raha & ostokset -sivulle.
- Talousindeksi vaikuttaa eurohintoihin ja euromaksuihin, mutta ei ryypyihin, apureihin tai parannuksiin.
- Olutkauppa, Supermarket, Pikkukeikat ja Kela seuraavat talousindeksiä omilla painoillaan.
- Uuden pelin aloitusraha säätyy osittain aloitusindeksin mukaan.
- Kela-maksut vaihtelevat nyt tukikohtaisen summavälin ja päätöstyypin mukaan.
- Kela-ongelmiin lisätty paperirumban lisäksi puhelujono, liitejahti ja tulotarkistus.
- Väärät Kela-valinnat lisäävät käsittelyyn päivän ja stressiä.
- Virastovaisto-parannus auttaa nyt selvästi paperirumba-ongelmiin.
- Ylävalikko jaettu viiteen sivuun: Arki, Raha & ostokset, Apurit & kehitys, Uhkapelit ja Tili.
- Peruspelin ruuhkaa kevennetty siirtämällä ostokset, rahanteko, apurit, parannukset ja tili omille sivuilleen.
- Numeropikanäppäimet toimivat nyt sivuille 1-5 uuden ylävalikon mukaan.
- Olutkaupan pakkauskoot tasapainotettu: 6-pack on edullisin, 12-pack ja 24-pack maksavat mukavuudesta.
- 24-packien hintavaihtelu on nostettu korkeammalle, jotta varastointi ei ole automaattisesti paras valinta.
- Kolmen kupin katastrofissa on nyt punaiset muovikupit, jotka kääntyvät sekoituksen jälkeen.
- Olutkauppaan lisätty 24-packit.
- Ylävälilehtiä voi vaihtaa näppäimistöllä: 1 peruspeli, 2 parannukset, 3 uhkapelit.
- Uhkapelit käyttävät nyt euroja panoksina ja voittoina ryypyn sijaan.
- Vasemman reunan Peli-painike vie takaisin sivun yläreunaan.
- Kolmen kupin katastrofin kupit vaihdettu pois pillimukeista.
- Pistetaulu näyttää nyt parhaat juodut oluet ryypyn sijaan.
- Supabase-tietokanta tarvitsee päivitetyn supabase-setup.sql-ajon olutpisteitä varten.
- Tilinluonti ohjaa sähköpostivahvistuksen takaisin nykyiseen peliosoitteeseen.
- Tiliosioon lisätty salasanan palautus sähköpostilinkin kautta.
- Uusi apuri Tuomas: halpa mutta arvaamaton, juo päivittäin satunnaisen osuuden täysistä tölkeistäsi.
- Tuomas antaa takaisin ryyppyinä joko 45 %, 75 % tai 100 % juomastaan määrästä.
- Uusi parannus "Nää on näitä" parantaa Tuomaksen palautukset tasolle 50 %, 80 % tai 105 %.
- Uusi parannus "Ei kyllä mä lähen nyt kotia" tekee Jarskista tehokkaamman: hän juo vain 15 tölkkiä mutta tuottaa 20 tölkin ryyppytuloksen.
- Uusi parannus "Mestari jätti pienet" nostaa Laurin päiväkulutuksen ja tuotannon 3 tölkistä 6 tölkkiin.
- Kuppipeli, karaoke, korttipeli, stressi, opas ja teemavärit ovat mukana.

Tiedostorakenne:
- index.html
- css/styles.css
- js/core.js
- js/ui.js
- js/modules/*.js
