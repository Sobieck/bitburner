/** @param {NS} ns */
//run scripts/hack.js
export async function main(ns) {
    const target = ns.args[0];

    await ns.hack(target);
}