Villisika-Sepon juomapeli — versio 0.4.18-aanensaato

Avaa index.html selaimessa.

Uutta tässä versiossa:
- Vasemman sivupalkin alaosaan lisätty äänenvoimakkuuden säädin.
- Äänenvoimakkuuden oletus ja aloitusarvo on 50 %.
- Karaokebiitti seuraa nyt yleistä äänenvoimakkuutta.
- Peliopas päivitetty vastaamaan nykyistä viisisivuista rakennetta, pilvitaloutta ja olutpisteitä.
- Vasemman reunan navigaatio on nyt ryhmitelty samassa järjestyksessä kuin ylävalikon sivut.
- Vasempaan navigaatioon lisätty erillinen Uhkapelit-painike.
- Sivujen ja moduulien väriteemoja yhtenäistetty: Arki, Raha, Apurit, Uhkapelit ja Tili erottuvat selkeämmin.
- Korjattu karaokebiitin käynnistys odottamaan selaimen äänikontekstin avautumista.
- Karaokebiitti on nyt selvästi kuuluvampi ja siinä on kevyt syntikkapulssi rummun tukena.
- Karaoketuomioon lisätty kevyt selaimessa luotu biitti, joka vaihtuu vaikeustason mukaan.
- Karaokebiitille lisätty pieni äänet päälle/pois -painike karaokeikkunaan.
- Onnistunut karaokeosuma tekee nyt hillityn laajenevan rengas-efektin nuolen kohdalle.
- Talousindeksi on nyt Supabase-pohjainen pilvitalous, eli sama arvo koskee kaikkia pelaajia.
- Pilvitalous päivittyy noin kerran päivässä klo 06.00 Suomen aikaa.
- Päivittäinen indeksiliike on yleensä noin -4 % - +5 %, harvinaisilla isommilla heilunnoilla.
- Supabase-tietokanta tarvitsee päivitetyn supabase-setup.sql-ajon pilvitaloutta varten.
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
