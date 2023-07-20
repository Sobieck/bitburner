let lastRecorded = new Date();

export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporationFileName = 'data/corporation.txt';
    const constants = ns.corporation.getConstants();
    let corporation = ns.corporation.getCorporation();
    const divisions = [];


    for (const divisionName of corporation.divisions) {
        let division = ns.corporation.getDivision(divisionName)
        division.offices = [];
        division.productObjects = [];

        for (const city of division.cities) {
            let office = ns.corporation.getOffice(division.name, city)

            if (ns.corporation.hasWarehouse(division.name, city)) {
                office.warehouse = ns.corporation.getWarehouse(division.name, city);
            }

            division.offices.push(office);
        }

        for (const productName of division.products) {
            division.productObjects.push(ns.corporation.getProduct(divisionName, "Aevum", productName));
        }

        divisions.push(division);
    }

    const corporationData = { constants, corporation, divisions };

    ns.rm(corporationFileName);
    ns.write(corporationFileName, JSON.stringify(corporationData), "W");


    const now = new Date();
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    if (now.getHours() !== lastRecorded.getHours()) { // && batches not running
        let snapshots = [];

        const snapshotsFileName = "data/corporateSnapshots.txt";
        if(ns.fileExists(snapshotsFileName)){
            snapshots = JSON.parse(ns.read(snapshotsFileName));
        }

        corporation.profit = formatter.format(corporation.revenue - corporation.expenses);
        corporation.funds = formatter.format(corporation.funds);
        corporation.revenue = formatter.format(corporation.revenue);
        corporation.expenses = formatter.format(corporation.expenses);
        corporation.sharePrice = formatter.format(corporation.sharePrice);
        corporation.snapshotTime = now;


        snapshots.push({ corporation, divisions });
        
        ns.rm(snapshotsFileName);
        ns.write(snapshotsFileName, JSON.stringify(snapshots), "W");

        lastRecorded = now;
    }
}