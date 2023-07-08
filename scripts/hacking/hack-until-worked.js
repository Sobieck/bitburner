/** @param {NS} ns */
//run scripts/hack.js
export async function main(ns) {
    const target = ns.args[0];
    let moneyStolen = 0;

    while (moneyStolen === 0) {
        moneyStolen = await ns.hack(target);
    }
}