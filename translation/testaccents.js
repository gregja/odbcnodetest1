const {dropAccents} = require('../library/tools.js');

let test = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûýýþÿŠŽšžŸ123,?';
console.log(dropAccents(test));
