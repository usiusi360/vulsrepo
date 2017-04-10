var vulsrepo = {
    detailRawData: null,
    detailPivotData: null,
    timeOut: 300 * 1000,
    demoFlag: false,
    link: {
        cwe_nvd: {
            url: "https://cwe.mitre.org/data/definitions/",
        },
        cwe_jvn: {
            url: "http://jvndb.jvn.jp/ja/cwe/",
        },
        mitre: {
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi",
            disp: "MITRE",
            find: "RESERVED"
        },
        cveDetail: {
            url: "http://www.cvedetails.com/cve/",
            disp: "CveDetails",
            find: "Unknown CVE ID"
        },
        nvd: {
            url: "https://nvd.nist.gov/vuln/detail/",
            disp: "NVD",
            find: "CVE ID Not Found"
        },
        jvn: {
            url: "http://jvndb.jvn.jp/search/index.php?mode=_vulnerability_search_IA_VulnSearch&keyword=",
            disp: "JVN",
            find: "Not found"
        },
        cvssV2Calculator: {
            url: "https://nvd.nist.gov/vuln-metrics/cvss/v2-calculator?name=",
            disp: "CVSSv2 Caluclator",
            find: "Warning: Unable to find vulnerability requested."
        },
        cvssV3Calculator: {
            url: "https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator?name=",
            disp: "CVSSv3 Caluclator",
            find: "Warning: Unable to find vulnerability requested."
        },
        rhel: {
            url: "https://access.redhat.com/security/cve/",
            disp: "RHEL",
            find: "Not Found"
        },
        debian: {
            url: "https://security-tracker.debian.org/tracker/",
            disp: "Debian",
            find: "DO NOT USE THIS CANDIDATE NUMBER"
        },
        ubuntu: {
            url: "https://people.canonical.com/~ubuntu-security/cve/",
            disp: "Ubuntu",
            find: "DO NOT USE THIS CANDIDATE NUMBER"
        },
        amazon: {
            url: "https://alas.aws.amazon.com/",
            disp: "Amazon",
            find: "AccessDenied"
        },
        rhn: {
            url: "https://rhn.redhat.com/errata/",
            disp: "RedHat Network",
            find: "Erratum not found"
        }
    }
};


var vulsrepo_template = [{
        key: '01. Graph: CVSS-Severity => ServerName',
        value: '{"rendererOptions":{"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"}},"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"},"derivedAttributes":{},"aggregators":{},"renderers":{},"hiddenAttributes":[],"menuLimit":3000,"cols":["ServerName","Container"],"rows":["CVSS Severity"],"vals":[],"rowOrder":"key_a_to_z","colOrder":"value_z_to_a","exclusions":{},"inclusions":{},"unusedAttrsVertical":85,"autoSortUnusedAttrs":false,"aggregatorName":"Count","rendererName":"Stacked Bar Chart","inclusionsInfo":{}}'
    },
    {
        key: '02. Graph: CVSS-Severity => CVSS-Score',
        value: '{"rendererOptions":{"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"}},"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"},"derivedAttributes":{},"aggregators":{},"renderers":{},"hiddenAttributes":[],"menuLimit":3000,"cols":["CVSS Score"],"rows":["CVSS Severity"],"vals":[],"rowOrder":"key_a_to_z","colOrder":"key_a_to_z","exclusions":{},"inclusions":{},"unusedAttrsVertical":85,"autoSortUnusedAttrs":false,"aggregatorName":"Count","rendererName":"Stacked Bar Chart","inclusionsInfo":{}}'
    },
    {
        key: '03. Pivot: Package/CVSS-Severity/CveID/Summary => ServerName',
        value: '{"rendererOptions":{"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"}},"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"},"derivedAttributes":{},"aggregators":{},"renderers":{},"hiddenAttributes":[],"menuLimit":3000,"cols":["ServerName","Container"],"rows":["Packages","CVSS Severity","CveID","Changelog","Summary"],"vals":[],"rowOrder":"key_a_to_z","colOrder":"key_a_to_z","exclusions":{},"inclusions":{},"unusedAttrsVertical":85,"autoSortUnusedAttrs":false,"aggregatorName":"Count","rendererName":"Heatmap","inclusionsInfo":{}}'
    },
    {
        key: '04. Pivot: Package/CveID => ScanTime',
        value: '{"rendererOptions":{"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"}},"localeStrings":{"renderError":"An error occurred rendering the PivotTable results.","computeError":"An error occurred computing the PivotTable results.","uiRenderError":"An error occurred rendering the PivotTable UI.","selectAll":"Select All","selectNone":"Select None","tooMany":"(too many to list)","filterResults":"Filter values","apply":"Apply","cancel":"Cancel","totals":"Totals","vs":"vs","by":"by"},"derivedAttributes":{},"aggregators":{},"renderers":{},"hiddenAttributes":[],"menuLimit":3000,"cols":["ScanTime"],"rows":["CveID","Packages","Changelog"],"vals":[],"rowOrder":"key_a_to_z","colOrder":"key_a_to_z","exclusions":{},"inclusions":{},"unusedAttrsVertical":85,"autoSortUnusedAttrs":false,"aggregatorName":"Count","rendererName":"Heatmap","inclusionsInfo":{}}'
    }
];