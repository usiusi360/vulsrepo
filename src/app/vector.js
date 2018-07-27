const getSeverityV2 = function(score) {
    if (score >= 7.0) {
        return "High";
    } else if ((score <= 6.9) && (score >= 4.0)) {
        return "Medium";
    } else if ((score <= 3.9) && (score >= 0.1)) {
        return "Low";
    } else if (score == 0) {
        return "None";
    }
};

const getSeverityV3 = function(score) {
    if (score >= 9.0) {
        return "Critical";
    } else if ((score <= 8.9) && (score >= 7.0)) {
        return "High";
    } else if ((score <= 6.9) && (score >= 4.0)) {
        return "Medium";
    } else if ((score <= 3.9) && (score >= 0.1)) {
        return "Low";
    } else if (score == 0) {
        return "None";
    }
};

const splitVectorString = function(fullVector) {
    return fullVector.replace(/\(|\)/g, '').split("/");
};

const getVectorStringV2 = function(vectorString) {
    const subscore = vectorString.split(":");

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
};



const getVectorV3 = function(vector) {
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
};