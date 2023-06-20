/** @param {NS} ns */
//run scripts/grow.js
export async function main(ns) {
    const target = ns.args[0];

    await ns.grow(target);
}