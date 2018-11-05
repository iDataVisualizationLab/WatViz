let utils = {
    datediff: function (first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    },
    monthdiff: function (d1, d2) {
        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months;
    },
    monthFormat(date) {
        let formatter = d3.timeFormat('%Y-%m');
        return formatter(date);
    },
    dateFormat(date){
        let formatter = d3.timeFormat("%Y-%m-%d");
        return formatter(date);
    }
};