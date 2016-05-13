/**
 * Created by Denys_Kostenko on 4/28/2016.
 */
window.jQuery = require('jquery');
require('bootstrap');
var whitespaceDot = require('whitespace-dot');

jQuery('.btn').on('click', function () {
  console.log(whitespaceDot.replaceWhitespaces('CDP hometask 2'));
});