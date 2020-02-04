const peaKaitse = 120;              //peakaitsme suurus

let kraadMinutid = -840;            //loetav modbus parameeter, kuna viide parameetri lugemisel on pikk anname varasemadd väärtused käivituste ennustamisele kui tegelikult 
let basseiniMahupaakTemp = 35;      //loetav modbus parameeter , basseinide mahupaago temperatuur
let cprStatusEP14 = 1;              //loetav modbus parameeter 43434, kompressor EP14 ON = 1 / OFF = 0
let cprStatusEP15 = 0;              //loetav modbus parameeter 43434, kompressor EP15 ON = 1 / OFF = 0
let cprStateEP14 = 20;              //loetav modbus parameeter , kompressor EP14 seisab = 20, käivitub = 40, käib = 60 või seiskub = 100
let cprStateEP15 = 20;              //loetav modbus parameeter , kompressor EP14 seisab = 20, käivitub = 40, käib = 60 või seiskub = 100
let elk15Aste = 0;                  //loetav modbus parameeter , milline aste ELK15 katlal on hetkel aktiivne, astmed 1 2 3 

let luxTemp = 0;            //modbus parameeter 47041 väärtus = 2 --- lux temperatuur/legionella aktiivne, boileri küttekeha potensiaalselt sisse lülitatud
let tarbeveeReziim = 1;     //modbus parameeter 48132 aktiveeritav ajutine lux tarbeveereziim, võimalikud väärtused > 0 kui aktiivne 

let kompressoriteAmperaaz = 0;      //kompressor EP14 või/ja EP15 käivad või sisse lülitumas kirjutame max käivitusvõimsuse
let elk15Amperaaz = 0;              //elektrikatel ELK15 aste 1 = 8A, aste 2 = 16A, aste 3 (astmed 1+2) = 24A
let boileriAmperaaz = 0;            //aktiveerunud 9kW elektriküttekeha boileris, 16A
let soojuspumbaKoguTarbimine = 0;   //kõigi küttesõlme suurte tarbijate summa
let hooneKogutarbimine = 0;         //hoone sisendfaasidelt mõõdetud hoone kogutarbimine
let vabaAmperaaz = 0;               //peakaitse - aktiivsed ja tõenäoliselt varsti aktiveeruvad soojuspumbasõlme tarbijad
let puhverAmperaaz = 16;            //puhver nt 16A kiirveekeedukannudele jm ennustamatutele tarbijatele

const poolKyttekeha1amperaaz = 12;  //esimene basseinide mahupaagi küttekeha, 8kW 12A
const poolKyttekeha2amperaaz = 24;  //teine basseinide mahupaagi küttekeha, 8kW 12A
const poolKyttekeha3amperaaz = 36;  //kolmas basseinide mahupaagi küttekeha, 8kW 12A

let poolKyttekeha1Releed = false;    // ühe 8kW küttekeha relee ON / OFF
let poolKyttekeha2Releed = false;    // kahe 8kW üttekeha releed ON / OFF
let poolKyttekeha3Releed = false;    // kolme 8kW küttekeha releed ON / OFF


/*Kontrollime kas kompressorite kävitumine on võibolla lähedal kraadminutite järgi või juba käivad/käivituvad, sel juhul 
reserveerime max käivitusvõimsuse 28A*/

if (kraadMinutid <= -50 || cprStatusEP14 + cprStatusEP15 > 0 || cprStateEP14 + cprStateEP15 > 50 ) {
    kompressoriteAmperaaz = 28;
} else {
kompressoriteAmperaaz = 0;
}

console.log(`Kompressorite amperaaz on: ${kompressoriteAmperaaz}A`);

/*Kontrollime kas kasutaja on aktiveerinud Lux tarbeveereziimi 
või ajutise lux temperatuuri
ja seeläbi potensiaalselt elektriküttekeha boileris 9kW = 14A*/

if (luxTemp === 2 || tarbeveeReziim !== 0 ) {
    boileriAmperaaz = 16;
} else {
    boileriAmperaaz = 0;
}

console.log('Tarbeveeboileri elektriküttekeha amperaaz on: ' + boileriAmperaaz);

/*Elektrikatla ELK15 astmed rakenduvad kraadMinutid loetud väärtustel -520, -550 ja -580
Kontrollime ega kraadminutid ei ole astmete rakendumise lähedal
ega reaalselt astmed aktiivsed ei ole, kui on siis võtame vastava 
vastava astme amperaazi ja kirjutame muutujasse elk15Amperaaz*/

/*kui kraadminutite järgi tõenäoliselt varsti lülitatakse ELK15 esimene aste sisse 
või juba on aktiivne, reserveerime võimsuse muutujasse elk15Amperaaz
*/
if ((kraadMinutid <= -510) || (elk15Aste === 1)  ) {
    elk15Amperaaz = 8;
} else {
        elk15Amperaaz = 0;
}

/*kui kraadminutite järgi tõenäoliselt varsti lülitatakse ELK15 teine aste sisse 
või juba on aktiivne, reserveerime võimsuse muutujasse elk15Amperaaz
*/

if ((kraadMinutid <= -540) || (elk15Aste === 2)  ) {
    elk15Amperaaz = 16;
} else {
        elk15Amperaaz = 0;
}

/*kui kraadminutite järgi tõenäoliselt varsti lülitatakse ELK15 kolmas aste sisse 
või juba on aktiivne, reserveerime võimsuse muutujasse elk15Amperaaz
*/

if ((kraadMinutid <= -570) || (elk15Aste === 3)  ) {
    elk15Amperaaz = 24;
} else {
        elk15Amperaaz = 0;
}

console.log(`Elektrikatla ELK15 amperaaz on: ${elk15Amperaaz} ja ELK15 aktiivne aste on: ${elk15Aste}.`);

/*Leiame sõlme suurtarbijate hetkevajaduse amprites*/

soojuspumbaKoguTarbimine = kompressoriteAmperaaz + elk15Amperaaz + boileriAmperaaz;

console.log(`Soojuspumbasõlme hetkeamperaaz on: ${soojuspumbaKoguTarbimine}A.`);

/*Leiame hetkel vabana oleva amperaazi ja lisame puhvri*/

vabaAmperaaz = peaKaitse - soojuspumbaKoguTarbimine - puhverAmperaaz;

console.log(`Hetkel vaba peakaitsme amperaaz on: ${vabaAmperaaz}A.`);

/*kontrollime basseinide/ventilatsiooni eelkütte mahupaagi temperatuuri ning otsustame kas on vaja aktiveerida abiküttekehad
alustades kõige võimsamast astmest kõik 3 elektriküttekeha aktiivsed kuni ainult ühe astmeni*/

if (basseiniMahupaakTemp <= 35 && vabaAmperaaz >= poolKyttekeha3amperaaz) {
        poolKyttekeha3Releed = true;
        poolKyttekeha2Releed = false;
        poolKyttekeha1Releed = false;
        console.log(`3 abiküttekeha aktiivsed: ${poolKyttekeha3Releed}`)

} else if (basseiniMahupaakTemp <= 35 && vabaAmperaaz >= poolKyttekeha2amperaaz) {
        poolKyttekeha3Releed = false;
        poolKyttekeha2Releed = true;
        poolKyttekeha1Releed = false;
        console.log(`2 abiküttekeha aktiivsed: ${poolKyttekeha2Releed}`);

} else if (basseiniMahupaakTemp <= 35 && vabaAmperaaz >= poolKyttekeha1amperaaz) {
        poolKyttekeha3Releed = false;
        poolKyttekeha2Releed = false;
        poolKyttekeha1Releed = true;
        console.log(`1 abiküttekeha aktiivsed: ${poolKyttekeha1Releed}`);      
        
} else {
        poolkyttekeha3Releed = false;
        poolkyttekeha2Releed = false;
        poolkyttekeha1Releed = false;
        console.log(`Vaba amperaaz ${vabaAmperaaz}A ei ole piisav kõigi kolme elektriküttekeha sisse lülitamiseks!`) 
}   
   
