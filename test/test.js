function count(selector, expected) {
    return function() {
        return document.querySelectorAll(selector).length === expected;
    };
}

var TestSuite = require('spatester');

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

testSuite.addTest("Autocomplete avec une liste de valeurs ( autocomplete.values = [...] )", function(scenario, asserter) {
    // Given
    scenario.exec(function() {
        var autocomplete = document.querySelector('x-autocomplete');

        autocomplete.values = ['aa', 'ab', 'b', 'c', 'd a'];
    });

    // When
    scenario.fill('x-autocomplete input', 'a');// l'événement 'change' déclenche pas l'ouverture de la liste ( .keyboard('x-autocomplete input',"keyup", "A", 65) marche pas)
    scenario.keyboard('x-autocomplete input',"keyup", "Down", 28);

    // Then
    asserter.expect('x-autocomplete').child('ul').to.have.nodeLength(1);
    asserter.expect('x-autocomplete ul').children('li').to.have.nodeLength(2);
});


testSuite.addTest("Autocomplete avec une fonction de recherche ( autocomplete.search = function(q){ autocomplete.suggestions = [...] } )", function(scenario, asserter) {
    // Given
    scenario.exec(function() {
        var autocomplete = document.querySelector('x-autocomplete');

        autocomplete.search = function(request) {
            this.suggestions = ['a', 'b', 'c'];
        }.bind(autocomplete);
    });

    // When
    scenario.fill('x-autocomplete input', 'x');
    scenario.keyboard('x-autocomplete input',"keyup", "Down", 28);

    // Then
    asserter.expect('x-autocomplete').child('ul').to.have.nodeLength(1);
    asserter.expect('x-autocomplete ul').children('li').to.have.nodeLength(3);

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

    asserter.expect('x-autocomplete').child('ul').to.have.nodeLength(1);

    //When
    scenario.click(".input-outside-test");

    //Then
    asserter.expect('x-autocomplete ul').to.be.hidden();
});

testSuite.addTest("Conservation de la donnée saisie en cas de click outside + réutilisation de cette valeur en cas de retour sur l'autocomplete", function(scenario, asserter) {

    //Given
    var input = document.createElement('input');
    input.classList.add('input-outside-test');
    document.body.appendChild(input);

    var keySet = 'a';

    scenario.exec(function() {
        document.querySelector('x-autocomplete').values = ['aa', 'ab', 'b', 'c', 'd a'];
    });
    scenario.fill('x-autocomplete input', keySet);

    //When
    scenario.click(".input-outside-test");

    //Then
    asserter.expect('x-autocomplete ul').to.be.hidden();
    asserter.expect('x-autocomplete input').to.have.value(keySet);

    // On revient sur l'auto-complete et on valide qu'on prend bien la précédente saisie en compte
    scenario.click('x-autocomplete .x-autocomplete-toggle').exec(function() {debugger;});

    asserter.expect('x-autocomplete').child('ul').to.have.nodeLength(1);
    asserter.expect('x-autocomplete ul').children('li').to.have.nodeLength(2);

});

document.addEventListener('DOMComponentsLoaded', function(){
    testSuite.run();
});