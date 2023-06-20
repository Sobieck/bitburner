/** @param {NS} ns */
//run scripts/weaken.js
export async function main(ns) {
    const target = ns.args[0];

    await ns.weaken(target);
}