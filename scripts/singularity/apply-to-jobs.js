export async function main(ns) {
    const organizations = JSON.parse(ns.read("data/organizations.txt"));
    const companiesWeWantToBecomePartOf = organizations.companiesWeWantToBecomePartOf;

    for (const companyName of companiesWeWantToBecomePartOf) {
        ns.singularity.applyToCompany(companyName, "software");
    }
}