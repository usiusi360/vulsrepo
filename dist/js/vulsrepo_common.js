
var getSeverity = function (Score) {
  if (Score >= 7.0) {
    return Array("High", "red");
  } else if ((Score < 7.0) && (Score >= 4.0)) {
    return Array("Medium", "orange");
  } else if ((Score < 4.0)) {
    return Array("Low", "#e6e600");
  }
};

var getSplitArray = function (full_vector) {
  return full_vector.replace(/\(|\)/g, '').split("/");
};

var getVector = {

  jvn: function (vector) {
    var subscore = vector.split(":");

    switch (subscore[0]) {
      case 'AV':
        switch (subscore[1]) {
          case 'L':
            return Array("LOCAL", "cvss-info");
            break;
          case 'A':
            return Array("ADJACENT_NETWORK", "cvss-warning");
            break;
          case 'N':
            return Array("NETWORK", "cvss-danger");
            break;
        }
      case 'AC':
        switch (subscore[1]) {
          case 'H':
            return Array("HIGH", "cvss-info");
            break;
          case 'M':
            return Array("MEDIUM", "cvss-warning");
            break;
          case 'L':
            return Array("LOW", "cvss-danger");
            break;
        }
      case 'Au':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-danger");
            break;
          case 'S':
            return Array("SINGLE_INSTANCE", "cvss-warning");
            break;
          case 'M':
            return Array("MULTIPLE_INSTANCES", "cvss-info");
            break;
        }
      case 'C':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
      case 'I':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
      case 'A':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
    }
  },

  nvd: function (category, impact) {

    switch (category) {
      case 'AV':
        switch (impact) {
          case 'LOCAL':
            return "cvss-info";
            break;
          case 'ADJACENT_NETWORK':
            return "cvss-warning";
            break;
          case 'NETWORK':
            return "cvss-danger";
            break;
        }
      case 'AC':
        switch (impact) {
          case 'HIGH':
            return "cvss-info";
            break;
          case 'MEDIUM':
            return "cvss-warning";
            break;
          case 'LOW':
            return "cvss-danger";
            break;
        }
      case 'Au':
        switch (impact) {
          case 'NONE':
            return "cvss-danger";
            break;
          case 'SINGLE_INSTANCE':
            return "cvss-warning";
            break;
          case 'MULTIPLE_INSTANCES':
            return "cvss-info";
            break;
        }
      case 'C':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
      case 'I':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
      case 'A':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
    }
  }
};
