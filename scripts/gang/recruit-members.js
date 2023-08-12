export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));

    const memberNames = [
        "Lisa",
        "Gidget",
        "Zoe",
        "Murray",
        "Butters",
        "Pablo Escobar",
        "Al Capone",
        "Michael Franzese",
        "Ronald Kray",
        "Lucky Luciano",
        "Caesar",
        "Augustus",
        "Hadrian",
        "Marcus Aurelius",
        "Marius",
        "Sulla",
        "Crassus",
        "Pompii",
        "Julia",
        "Tiberius",
        "Caligula",
        "Claudius",
        "Elizabeth",
        "Vespasian",
        "Domitian",
        "Trajan",
        "Antoninus Pius",
        "Lucius Verus",
        "Pertinax",
        "Septimius Severus",
        "Geta",
        "Basil",
        "William"
    ]

    if(ns.gang.canRecruitMember()){
        ns.gang.recruitMember(memberNames[gang.members.length]);
    }

}