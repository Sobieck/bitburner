export async function main(ns) {
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const stopInvestingFileName = "stopInvesting.txt";
    if (ns.fileExists(stopInvestingFileName)) {
        if (ns.fileExists(ramObservationsTextFile)) {
            ns.rm(ramObservationsTextFile);
        }
        return;
    }

    await upgradeHomeRamOrCpu(ns, 11_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000);
    await upgradeHomeRamOrCpu(ns, 30_000_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000_000);
    await upgradeHomeRamOrCpu(ns, 1_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 10_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 1_000_000_000_000_000);
}

async function upgradeHomeRamOrCpu(ns, moneyLeftLimit) {

    const ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost();
    const coreUpgradeCost = ns.singularity.getUpgradeHomeCoresCost();

    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (ramUpgradeCost < coreUpgradeCost) {

        const moneyLeftOverForRam = moneyAvailable - ramUpgradeCost;

        if (moneyLeftOverForRam > moneyLeftLimit) {
            ns.singularity.upgradeHomeRam();
            ns.toast(`Upgraded home ram`, "success", null);
            await ns.sleep(100);
        }

    } else {

        const moneyLeftOverForCores = moneyAvailable - coreUpgradeCost;

        if (moneyLeftOverForCores > moneyLeftLimit) {
            ns.singularity.upgradeHomeCores()
            ns.toast(`Upgraded home core`, "success", null);
            await ns.sleep(100);
        }
    }
}
