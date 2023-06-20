/** @param {NS} ns */
//run scripts/early-hack.js -t 2000 rothman-uni 4339119600 22
export async function main(ns) {
    const target = ns.args[0];
    const moneyThresh = ns.args[1];
    const securityThresh = ns.args[2];

    while(true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target); 
        }
    }
}