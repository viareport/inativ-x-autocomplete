function count(selector, expected) {
    return function() {
        return document.querySelectorAll(selector).length === expected;
    };
}

var TestSuite = require('spatester').TestSuite;

var testSuite = new TestSuite("Autocomplete test", {
    setUp: function() {
        var autocomplete = document.createElement('x-autocomplete');
        document.body.appendChild(autocomplete);
    },

    tearDown: function() {
        var autocomplete = document.querySelector('x-autocomplete');
        document.body.removeChild(autocomplete);
    }
});

Testem.useCustomAdapter(function(socket) {
    testSuite.setSocket(socket);
});

testSuite.addTest("Autocomplete avec une liste de valeurs ( autocomplete.values = [...] )", function(scenario, asserter) {
    scenario.exec(function() {
        var autocomplete = document.querySelector('x-autocomplete');

        autocomplete.values = ['aa', 'ab', 'b', 'c', 'd a'];
    });
    scenario.fill('x-autocomplete input', 'a');// l'événement 'change' déclenche pas l'ouverture de la liste ( .keyboard('x-autocomplete input',"keyup", "A", 65) marche pas)
    scenario.keyboard('x-autocomplete input',"keyup", "Down", 28);
    asserter.assertTrue(
        count("x-autocomplete ul", 1), 'La liste des suggestions doit apparaître');
    asserter.assertTrue(
        count("x-autocomplete ul li", 2), 'La liste des suggestions doit contenir 2 éléments ("aa" et "ab")');
});


testSuite.addTest("Autocomplete avec une fonction de recherche ( autocomplete.search = function(q){ autocomplete.suggestions = [...] } )", function(scenario, asserter) {

    scenario.exec(function() {
        var autocomplete = document.querySelector('x-autocomplete');

        autocomplete.search = function(request) {
            this.suggestions = ['a', 'b', 'c'];
        }.bind(autocomplete);
    });
    scenario.fill('x-autocomplete input', 'x');
    scenario.keyboard('x-autocomplete input',"keyup", "Down", 28);
    asserter.assertTrue(
        count("x-autocomplete ul", 1), 'La liste des suggestions doit apparaître');
    asserter.assertTrue(
        count("x-autocomplete ul li", 3), 'La liste des suggestions doit contenir 3 éléments (a, b, c)');

});

testSuite.addTest("Lorsqu'on clique en dehors de l'autocomplete, (en particulier dans un input) alors que celui-ci est ouvert, il doit se fermer", function(scenario, asserter) {

    //Given
    var input = document.createElement('input');
    input.classList.add('input-outside-test');
    document.body.appendChild(input);
    scenario.exec(function() {
        var autocomplete = document.querySelector('x-autocomplete');

        autocomplete.values = ['aa', 'ab', 'b', 'c', 'd a'];
    });
    scenario.fill('x-autocomplete input', 'a');// l'événement 'change' déclenche pas l'ouverture de la liste ( .keyboard('x-autocomplete input',"keyup", "A", 65) marche pas)
    scenario.keyboard('x-autocomplete input',"keyup", "Down", 28);
    asserter.assertTrue(
        count("x-autocomplete ul", 1), 'La liste des suggestions doit apparaître');

    //When
    scenario.click(".input-outside-test");

    //Then
    asserter.assertTrue(function() {
        return document.querySelector("x-autocomplete ul").style.display === 'none';
    }, 'La liste des suggestions doit disparaitre');

});

document.addEventListener('DOMComponentsLoaded', function(){
    testSuite.run();
});