var getSeverity = function(Score) {
    if (Score >= 7.0) {
        return Array("High", "#ffc800");
    } else if ((Score <= 6.9) && (Score >= 4.0)) {
        return Array("Medium", "#ffff00");
    } else if ((Score <= 3.9) && (Score >= 0.1)) {
        return Array("Low", "##ffe5d0");
    } else if (Score == 0) {
        return Array("None", "white");
    }
};

var getSeverityV3 = function(Score) {
    if (Score >= 9.0) {
        return Array("Critical", "#ff0000");
    } else if ((Score <= 8.9) && (Score >= 7.0)) {
        return Array("High", "#ffc800");
    } else if ((Score <= 6.9) && (Score >= 4.0)) {
        return Array("Medium", "#ffff00");
    } else if ((Score <= 3.9) && (Score >= 0.1)) {
        return Array("Low", "#ffe5d0");
    } else if (Score == 0) {
        return Array("None", "white");
    }
};


var getSplitArray = function(full_vector) {
    return full_vector.replace(/\(|\)/g, '').split("/");
};

var getVectorV2 = {

    cvss: function(vector) {
        var subscore = vector.split(":");

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



var getVectorV3 = {

    cvss: function(vector) {
        var subscore = vector.split(":");

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

var getHelpMes = function(target, type) {

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

var displayHelpMes = function() {
    $.each(["jvn", "nvd"], function(x, x_val) {
        $.each(["av", "ac", "au", "c", "i", "a"], function(x, y_val) {
            $("#tooltip_" + x_val + "_" + y_val).balloon({
                html: true,
                css: {
                    fontSize: '80%',
                    maxWidth: '700px'
                },
                contents: getHelpMes(x_val, y_val)
            });
        });
    });
};