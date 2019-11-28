const getSeverityV2 = function(Score) {
    if (Score >= 7.0) {
        return "High";
    } else if ((Score <= 6.9) && (Score >= 4.0)) {
        return "Medium";
    } else if ((Score <= 3.9) && (Score >= 0.1)) {
        return "Low";
    } else if (Score == 0) {
        return "None";
    }
};

const getSeverityV3 = function(Score) {
    if (Score >= 9.0) {
        return "Critical";
    } else if ((Score <= 8.9) && (Score >= 7.0)) {
        return "High";
    } else if ((Score <= 6.9) && (Score >= 4.0)) {
        return "Medium";
    } else if ((Score <= 3.9) && (Score >= 0.1)) {
        return "Low";
    } else if (Score == 0) {
        return "None";
    }
};


const getSplitArray = function(full_vector) {
    return full_vector.replace(/\(|\)/g, '').split("/");
};

const getVectorV2 = {

    cvss: function(vector) {
        const subscore = vector.split(":");

        switch (subscore[0]) {
            case 'AV':
                switch (subscore[1]) {
                    case 'L':
                        return Array("LOCAL", 1);
                        break;
                    case 'A':
                        return Array("ADJACENT_NETWORK", 2);
                        break;
                    case 'N':
                        return Array("NETWORK", 3);
                        break;
                }
            case 'AC':
                switch (subscore[1]) {
                    case 'H':
                        return Array("HIGH", 1);
                        break;
                    case 'M':
                        return Array("MEDIUM", 2);
                        break;
                    case 'L':
                        return Array("LOW", 3);
                        break;
                }
            case 'Au':
                switch (subscore[1]) {
                    case 'M':
                        return Array("MULTIPLE_INSTANCES", 1);
                        break;
                    case 'S':
                        return Array("SINGLE_INSTANCE", 2);
                        break;
                    case 'N':
                        return Array("NONE", 3);
                        break;
                }
            case 'C':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'P':
                        return Array("PARTIAL", 2);
                        break;
                    case 'C':
                        return Array("COMPLETE", 3);
                        break;
                }
            case 'I':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'P':
                        return Array("PARTIAL", 2);
                        break;
                    case 'C':
                        return Array("COMPLETE", 3);
                        break;
                }
            case 'A':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'P':
                        return Array("PARTIAL", 2);
                        break;
                    case 'C':
                        return Array("COMPLETE", 3);
                        break;
                }
        }
    }
};



const getVectorV3 = {

    cvss: function(vector) {
        const subscore = vector.split(":");

        switch (subscore[0]) {
            case 'AV':
                switch (subscore[1]) {
                    case 'P':
                        return Array("PHYSICAL", 1);
                        break;
                    case 'L':
                        return Array("LOCAL", 2);
                        break;
                    case 'A':
                        return Array("ADJACENT_NETWORK", 3);
                        break;
                    case 'N':
                        return Array("NETWORK", 4);
                        break;
                }
            case 'AC':
                switch (subscore[1]) {
                    case 'H':
                        return Array("HIGH", 1);
                        break;
                    case 'L':
                        return Array("LOW", 3);
                        break;
                }
            case 'PR':
                switch (subscore[1]) {
                    case 'H':
                        return Array("HIGH", 1);
                        break;
                    case 'L':
                        return Array("LOW", 2);
                        break;
                    case 'N':
                        return Array("NONE", 3);
                        break;
                }
            case 'UI':
                switch (subscore[1]) {
                    case 'R':
                        return Array("REQUIRED", 1);
                        break;
                    case 'N':
                        return Array("NONE", 3);
                        break;
                }
            case 'S':
                switch (subscore[1]) {
                    case 'U':
                        return Array("UNCHANGED", 1);
                        break;
                    case 'C':
                        return Array("CHANGED", 3);
                        break;
                }
            case 'C':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'L':
                        return Array("LOW", 2);
                        break;
                    case 'H':
                        return Array("HIGH", 3);
                        break;
                }
            case 'I':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'L':
                        return Array("LOW", 2);
                        break;
                    case 'H':
                        return Array("HIGH", 3);
                        break;
                }
            case 'A':
                switch (subscore[1]) {
                    case 'N':
                        return Array("NONE", 1);
                        break;
                    case 'L':
                        return Array("LOW", 2);
                        break;
                    case 'H':
                        return Array("HIGH", 3);
                        break;
                }
        }
    }
};

const getHelpMes = function(target, type) {

    let helpMes = {
        jvn: {
            av: [{
                    title: 'LOCAL / ローカル',
                    desp: '・対象システムを物理アクセスやローカル環境から攻撃する必要がある <br> ・例えば、IEEE 1394 、 USB 経由、ローカルアクセス権限で攻撃が必要など'
                },
                {
                    title: 'ADJACENT_NETWORK / 隣接',
                    desp: '・対象システムを隣接ネットワークから攻撃する必要がある<br> ・例えば、ローカル IP サブネット、ブルートゥース、 IEEE 802.11 など'
                },
                {
                    title: 'NETWORK / ネットワーク',
                    desp: '・対象システムをネットワーク経由でリモートから攻撃可能である<br> ・例えば RPC バッファオーバーフロー攻撃など'
                }
            ],
            ac: [{
                    title: 'HIGH / 高',
                    desp: '・攻撃前に、権限昇格や偽装、疑われやすい方法での情報収集が必要である<br>・対象システムが特定の設定の場合のみ攻撃可能である'
                },
                {
                    title: 'MEDIUM / 中',
                    desp: '・特定のグループのシステムやユーザに対してのみ攻撃可能である<br>・攻撃前にいくつかの情報収集が必要である<br>・攻撃するには、標準以外の設定になっている必要がある'
                },
                {
                    title: 'LOW / 低',
                    desp: '	・特別な攻撃条件を必要とせず、対象システムを常に攻撃可能である'
                }
            ],
            au: [{
                    title: 'MULTIPLE_INSTANCES / 複数',
                    desp: '・攻撃する場合、2つ以上の認証（ログイン等）が必要である'
                },
                {
                    title: 'SINGLE_INSTANCE / 単一',
                    desp: '・攻撃前に認証（ログイン等）が必要である'
                },
                {
                    title: 'NONE / 不要',
                    desp: '・攻撃前に認証（ログイン等）が不要である'
                }
            ],
            c: [{
                    title: 'NONE / なし',
                    desp: '・システムの機密性に影響はない'
                },
                {
                    title: 'PARTIAL / 部分的',
                    desp: '・一部の機密情報が参照可能である<br> ・一部の重要なシステムファイルが参照可能である'
                },
                {
                    title: 'COMPLETE / 全面的',
                    desp: '・メモリやファイルにある機密情報が全て参照可能である<br>・重要なシステムファイルが全て参照可能である'
                }
            ],
            i: [{
                    title: 'NONE / なし',
                    desp: '・システムの完全性に影響はない'
                },
                {
                    title: 'PARTIAL / 部分的',
                    desp: '・一部の情報が改ざん可能である<br>・一部のシステムファイルが改ざん可能である'
                },
                {
                    title: 'COMPLETE / 全面的',
                    desp: '・システム全体の情報が改ざん可能である<br>・システム保護機能を全て回避し、情報が改ざん可能である'
                }
            ],
            a: [{
                    title: 'NONE / なし',
                    desp: '・システムの可用性に影響はない'
                },
                {
                    title: 'PARTIAL / 部分的',
                    desp: '・リソース（ネットワーク帯域、プロセッサ処理、ディスクスペースなど）を一部枯渇させることが可能である<br>・業務の遅延や一時中断が可能である'
                },
                {
                    title: 'COMPLETE / 全面的',
                    desp: '	・リソースを完全に枯渇させることが可能である<br>・システムを完全に停止させることが可能である'
                }
            ]
        },

        nvd: {
            av: [{
                    title: 'LOCAL',
                    desp: 'A vulnerability exploitable with only local access requires the attacker to have either physical access to the vulnerable system or a local (shell) account. Examples of locally exploitable vulnerabilities are peripheral attacks such as Firewire/USB DMA attacks, and local privilege escalations (e.g., sudo).'
                },
                {
                    title: 'ADJACENT_NETWORK',
                    desp: 'A vulnerability exploitable with adjacent network access requires the attacker to have access to either the broadcast or collision domain of the vulnerable software.  Examples of local networks include local IP subnet, Bluetooth, IEEE 802.11, and local Ethernet segment.'
                },
                {
                    title: 'NETWORK',
                    desp: 'A vulnerability exploitable with network access means the vulnerable software is bound to the network stack and the attacker does not require local network access or local access. Such a vulnerability is often termed "remotely exploitable". An example of a network attack is an RPC buffer overflow.'
                }
            ],
            ac: [{
                    title: 'HIGH',
                    desp: 'Specialized access conditions exist. For example:- In most configurations, the attacking party must already have elevated privileges or spoof additional systems in addition to the attacking system (e.g., DNS hijacking).'
                },
                {
                    title: 'MEDIUM',
                    desp: 'The access conditions are somewhat specialized; the following are examples:- The attacking party is limited to a group of systems or users at some level of authorization, possibly untrusted.'
                },
                {
                    title: 'LOW',
                    desp: 'Specialized access conditions or extenuating circumstances do not exist. The following are examples:- The affected product typically requires access to a wide range of systems and users, possibly anonymous and untrusted (e.g., Internet-facing web or mail server).'
                }
            ],
            au: [{
                    title: 'MULTIPLE',
                    desp: 'Exploiting the vulnerability requires that the attacker authenticate two or more times, even if the same credentials are used each time. An example is an attacker authenticating to an operating system in addition to providing credentials to access an application hosted on that system.'
                },
                {
                    title: 'SINGLE',
                    desp: 'The vulnerability requires an attacker to be logged into the system (such as at a command line or via a desktop session or web interface).'
                },
                {
                    title: 'NONE',
                    desp: 'Authentication is not required to exploit the vulnerability.'
                }
            ],
            c: [{
                    title: 'NONE',
                    desp: 'There is no impact to the confidentiality of the system.'
                },
                {
                    title: 'PARTIAL',
                    desp: 'There is considerable informational disclosure. Access to some system files is possible, but the attacker does not have control over what is obtained, or the scope of the loss is constrained. An example is a vulnerability that divulges only certain tables in a database.'
                },
                {
                    title: 'COMPLETE',
                    desp: 'There is total information disclosure, resulting in all system files being revealed. The attacker is able to read all of the system’s data (memory, files, etc.)'
                }
            ],
            i: [{
                    title: 'NONE',
                    desp: 'There is no impact to the integrity of the system.'
                },
                {
                    title: 'PARTIAL',
                    desp: 'Modification of some system files or information is possible, but the attacker does not have control over what can be modified, or the scope of what the attacker can affect is limited. For example, system or application files may be overwritten or modified, but either the attacker has no control over which files are affected or the attacker can modify files within only a limited context or scope.'
                },
                {
                    title: 'COMPLETE',
                    desp: '	There is a total compromise of system integrity. There is a complete loss of system protection, resulting in the entire system being compromised. The attacker is able to modify any files on the target system.'
                }
            ],
            a: [{
                    title: 'NONE',
                    desp: 'There is no impact to the availability of the system.'
                },
                {
                    title: 'PARTIAL',
                    desp: 'There is reduced performance or interruptions in resource availability. An example is a network-based flood attack that permits a limited number of successful connections to an Internet service.'
                },
                {
                    title: 'COMPLETE',
                    desp: 'There is a total shutdown of the affected resource. The attacker can render the resource completely unavailable.'
                }
            ]
        }
    }

    let tmp_tr = "";
    $.each(helpMes[target][type], function(x, x_val) {
        tmp_tr = tmp_tr + "<tr><td>" + x_val.title + "</td><td>" + x_val.desp + "</td></tr>"
    });
    return '<table class="cvss_tooltip"><tbody>' + tmp_tr + '</tbody></table>';
};

// const displayHelpMes = function() {
//     $.each(["jvn", "nvd"], function(x, x_val) {
//         $.each(["av", "ac", "au", "c", "i", "a"], function(x, y_val) {
//             $("#tooltip_" + x_val + "_" + y_val).balloon({
//                 html: true,
//                 css: {
//                     fontSize: '80%',
//                     maxWidth: '700px'
//                 },
//                 contents: getHelpMes(x_val, y_val)
//             });
//         });
//     });
// };



const displayHelpMesScore = function() {

    $("#tooltip_score").balloon({
        html: true,
        position: "right",
        offsetY: -350,
        css: {
            fontSize: '80%',
            width: '1024',
            opacity: 0.95,
            minLifetime: 2000
        },
        contents: isHelpHTMLScore()
    });

};

const isHelpHTMLScore = function() {
    return `
    <div class="col-xs-2">
        <div> NVD(v2), JVN(v2)</div>
        <table class="cvss_tooltip">
            <tbody>
                <tr>
                    <th>Severity</th>
                    <th>Score</th>
                </tr>
                <tr>
                    <td class="cvss-High">High</td>
                    <td>7.0 ～ 10.0</td>
                </tr>
                <tr>
                    <td class="cvss-Medium">Medium</td>
                    <td>4.0 ～ 6.9</td>
                </tr>
                <tr>
                    <td class="cvss-Low">Low</td>
                    <td>0.1 ～ 3.9</td>
                </tr>
                <tr>
                    <td class="cvss-None">None</td>
                    <td>0</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="col-xs-2">
        <div> NVD(v3), JVN(v3)</div>
        <table class="cvss_tooltip">
            <tbody>
                <tr>
                    <th>Severity</th>
                    <th>Score</th>
                </tr>
                <tr>
                    <td class="cvss-Critical">Critical</td>
                    <td>9.0 ～ 10.0</td>
                </tr>
                <tr>
                    <td class="cvss-High">High</td>
                    <td>7.0 ～ 8.9</td>
                </tr>
                <tr>
                    <td class="cvss-Medium">Medium</td>
                    <td>4.0 ～ 6.9</td>
                </tr>
                <tr>
                    <td class="cvss-Low">Low</td>
                    <td>0.1 ～ 3.9</td>
                </tr>
                <tr>
                    <td class="cvss-None">None</td>
                    <td>0</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="col-xs-8">
        <div> Amazon</div>
        <table class="cvss_tooltip">
            <tbody>
                <tr>
                    <th>Severity</th>
                    <th>Score</th>
                </tr>
                <tr>
                    <td class="cvss-Critical">Critical</td>
                    <td>Findings that are associated with an adversary completing their objectives, such as active data loss or compromise or a denial of service. This generally aligns to the Effects namespace under a findings type.</td>
                </tr>
                <tr>
                    <td class="cvss-High">Important</td>
                    <td>Findings that are associated with an adversary completing their objectives, such as active data loss or compromise or a denial of service. This generally aligns to the Effects namespace under a findings type.</td>
                </tr>
                <tr>
                    <td class="cvss-Medium">Medium</td>
                    <td>Findings that are associated with issues that indicate an active compromise, but no indication that an adversary has completed their objectives (e.g., malware activity, hacking activity, or unusual behavior detection). This generally aligns to the Threat Detections and Unusual Behavior namespaces under a findings type.</td>
                </tr>
                <tr>
                    <td class="cvss-Low">Low</td>
                    <td>Findings that are associated with issues that could result in future compromises (e.g., vulnerabilities, configuration weaknesses, exposed passwords). This generally aligns to the Software and Configuration Checks namespace under a findings type.</td>
                </tr>
                <tr>
                    <td class="cvss-None">None</td>
                    <td>None</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="col-xs-12">&nbsp;</div>
    <div class="col-xs-6">
        <div>RedHat(v2), RedHat(v3) <a href="https://access.redhat.com/security/updates/classification" target="_blank">Understanding Red Hat security ratings</a></div>
        <table class="cvss_tooltip">
            <tbody>
                <tr>
                    <th>Severity</th>
                    <th>Score</th>
                </tr>
                <tr>
                    <td class="cvss-Critical">Critical</td>
                    <td>This rating is given to flaws that could be easily exploited by a remote unauthenticated attacker and lead to system compromise (arbitrary code execution) without requiring user interaction. These are the types of vulnerabilities that can be exploited by worms. Flaws that require an authenticated remote user, a local user, or an unlikely configuration are not classed as Critical impact.</td>
                </tr>
                <tr>
                    <td class="cvss-Important">Important</td>
                    <td>This rating is given to flaws that can easily compromise the confidentiality, integrity, or availability of resources. These are the types of vulnerabilities that allow local users to gain privileges, allow unauthenticated remote users to view resources that should otherwise be protected by authentication, allow authenticated remote users to execute arbitrary code, or allow remote users to cause a denial of service.</td>
                </tr>
                <tr>
                    <td class="cvss-Moderate">Moderate</td>
                    <td>This rating is given to flaws that may be more difficult to exploit but could still lead to some compromise of the confidentiality, integrity, or availability of resources, under certain circumstances. These are the types of vulnerabilities that could have had a Critical impact or Important impact but are less easily exploited based on a technical evaluation of the flaw, or affect unlikely configurations.</td>
                </tr>
                <tr>
                    <td class="cvss-Low">Low</td>
                    <td>This rating is given to all other issues that have a security impact. These are the types of vulnerabilities that are believed to require unlikely circumstances to be able to be exploited, or where a successful exploit would give minimal consequences.</td>
                </tr>
                <tr>
                    <td class="cvss-None">None</td>
                    <td>None</td>
                </tr>
            </tbody>
        </table>
    </div>
        <div class="col-xs-6">
        <div>Ubuntu, Debian <a href="https://people.canonical.com/~ubuntu-security/cve/priority.html" target="_blank">Ubuntu priority</a></div>
        <table class="cvss_tooltip">
            <tbody>
                <tr>
                    <th>Severity</th>
                    <th>Score</th>
                </tr>
                <tr>
                    <td class="cvss-Critical">Critical</td>
                    <td>Open vulnerability that is a world-burning problem, exploitable for nearly all people in a default installation. Includes remote root privilege escalations, or massive data loss.</td>
                </tr>
                <tr>
                    <td class="cvss-High">High</td>
                    <td>Open vulnerability that is a real problem, exploitable for many people in a default installation. Includes serious remote denial of services, local root privilege escalations, or data loss.</td>
                </tr>
                <tr>
                    <td class="cvss-Medium">Medium</td>
                    <td>Open vulnerability that is a real security problem, and is exploitable for many people. Includes network daemon denial of service attacks, cross-site scripting, and gaining user privileges. Updates should be made soon for this priority of issue.</td>
                </tr>
                <tr>
                    <td class="cvss-Low">Low</td>
                    <td>Open vulnerability that is a security problem, but is hard to exploit due to environment, requires a user-assisted attack, a small install base, or does very little damage. These tend to be included in security updates only when higher priority issues require an update, or if many low priority issues have built up.</td>
                </tr>
                <tr>
                    <td class="cvss-Negligible">Negligible</td>
                    <td>Open vulnerability that is technically a security problem, but is only theoretical in nature, requires a very special situation, has almost no install base, or does no real damage. These tend not to get backported from upstream, and will likely not be included in security updates unless there is an easy fix and some other issue causes an update.</td>
                </tr>
                <tr>
                    <td class="cvss-Unknown">Unknown</td>
                    <td>Open vulnerability where the priority is currently unknown and needs to be triaged.</td>
                </tr>
                <tr>
                    <td class="cvss-Pending">Pending</td>
                    <td>A fix has been applied and updated packages are awaiting arrival into the archive. This often used when a package is received into -proposed for wider testing.</td>
                </tr>
                <tr>
                    <td class="cvss-NotVulnerable">Not Vulnerable</td>
                    <td>Packages which do not exist (DNE) in the archive, are not affected by the vulnerability or have a fix applied in the archive.</td>
                </tr>
            </tbody>
        </table>
    </div>
    `;
}


const detailLink = {
    cwe_nvd: {
        url: "https://cwe.mitre.org/data/definitions/",
    },
    cwe_jvn: {
        url: "http://jvndb.jvn.jp/ja/cwe/",
    },
    mitre: {
        url: "https://cve.mitre.org/cgi-bin/cvename.cgi",
        disp: "MITRE"
    },
    cveDetail: {
        url: "http://www.cvedetails.com/cve/",
        disp: "CveDetails"
    },
    nvd: {
        url: "https://nvd.nist.gov/vuln/detail/",
        disp: "NVD"
    },
    jvn: {
        url: "http://jvndb.jvn.jp/search/index.php?mode=_vulnerability_search_IA_VulnSearch&keyword=",
        disp: "JVN"
    },
    cvssV2Calculator: {
        url: "https://nvd.nist.gov/vuln-metrics/cvss/v2-calculator?name=",
        disp: "CVSS Calculator V2"
    },
    cvssV3Calculator: {
        url: "https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator?name=",
        disp: "CVSS Calculator V3"
    },
    cvssV3CalculatorJvn: {
        url: "https://jvndb.jvn.jp/cvss/ja/v3.html",
        disp: "CVSS Calculator V3 (JVN)"
    },
    rhel: {
        url: "https://access.redhat.com/security/cve/",
        disp: "RHEL"
    },
    debian: {
        url: "https://security-tracker.debian.org/tracker/",
        disp: "Debian"
    },
    ubuntu: {
        url: "https://people.canonical.com/~ubuntu-security/cve/",
        disp: "Ubuntu"
    },
    amazon: {
        url: "https://alas.aws.amazon.com/",
        disp: "Amazon"
    },
    rhn: {
        url: "https://access.redhat.com/errata/",
        disp: "RedHat Network",
    },
    oracle: {
        url: "https://linux.oracle.com/cve/",
        disp: "Oracle"
    },
    oracleErrata: {
        url: "https://linux.oracle.com/errata/",
        disp: "OracleLinux Errata"
    }
}