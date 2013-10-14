(function () {
    var position = {UP:'up',DOWN:'down'};
    var nbAutocompleteInserted = 0;
    var constSuggestionsNode = null;
    var wrapperSuggestionsNode = null;

    function createSuggestionBlock() {
        wrapperSuggestionsNode = document.createElement('div');
        constSuggestionsNode = document.createElement('ul');
        constSuggestionsNode.style.display = 'none';
        constSuggestionsNode.classList.add('autocomplete');
        wrapperSuggestionsNode.appendChild(constSuggestionsNode);
        document.body.appendChild(wrapperSuggestionsNode);
    }

    function removeSuggestionBlock() {
        document.body.removeChild(wrapperSuggestionsNode);
    }

    xtag.register('x-autocomplete', {
        lifecycle: {
            created: function created() {
                this._input = document.createElement('input');
                this._input.setAttribute('type', 'text');
                this.appendChild(this._input);

                this._toggleSuggestions = document.createElement('span');
                this._toggleSuggestions.className = 'x-autocomplete-toggle';
                this.appendChild(this._toggleSuggestions);


                this._selectedIndex = null;

                // default search method (needs this.values being set)
                this.search = this.suggest;
                this.maximumHeight = 0;
                //default template
                this.suggestionTemplate = function (value) {
                    return value;
                };

                //default classes
                this.suggestionClasses = function (value) {
                    return '';
                };

                this._onSearchCompleted = function () {
                    if (this.suggestions.length) {
                        this.choosePosition();
                        this.showSuggestions();
                        this.selectedIndex = 0;

                        if (this.hasAttribute('forceSelection')) {
                            this._lastValid = this._input.value;
                            if (this.suggestions.length === 1) {
                                this.pick();
                            }
                        }
                    } else if (this.hasAttribute('forceSelection')) {
                        this._value = null;
                        this._input.value = this._lastValid || '';
                    } else {
                        this.choosePosition();
                        this.showSuggestions();
                    }
                }.bind(this);

                this._clickOutsideListener = function _clickOutsideListener(e) {
                    if (this.isOpen() && this !== e.target && !this.contains(e.target)) {
                        this.toggleSuggestions();
                    }
                }.bind(this);
            },
            inserted: function inserted() {
                if(!nbAutocompleteInserted) {
                    createSuggestionBlock();
                }

                nbAutocompleteInserted++;
                window.document.addEventListener('click', this._clickOutsideListener, false);
            },
            removed: function removed() {
                nbAutocompleteInserted--;

                if (!nbAutocompleteInserted) {
                    removeSuggestionBlock();
                }
                window.document.removeEventListener('click', this._clickOutsideListener, false);
            },
            attributeChanged: function attributedChanged(attribute) {
            }
        },
        accessors: {
            values: {
                set: function (values) {
                    this._values = values;
                    this._suggestionValues = values;
                },
                get: function () {
                    return this._values;
                }
            },

            value: {
                set: function (value) {
                    this._value = value;
                    this._input.value = this.suggestionTemplate(value);

                    this.dispatchEvent(new CustomEvent('valueChanged', {
                        detail: {newValue: value},
                        bubbles: false
                    }));
                },
                get: function () {
                    return this._value;
                }
            },

            selectedIndex: {
                set: function (selectedIndex) {
                    if (this._selectedIndex !== null && this.getSuggestionNodes()[this._selectedIndex]) {
                        this.getSuggestionNodes()[this._selectedIndex].classList.remove('x-autocomplete-selected');
                    }
                    this._selectedIndex = selectedIndex;
                    var selectedNode = this.getSuggestionNodes()[this._selectedIndex];
                    selectedNode.classList.add('x-autocomplete-selected');
                },
                get: function () {
                    return this._selectedIndex;
                }
            },
            suggestions: {
                set: function (values) {
                    this._suggestionValues = values;
                    this._onSearchCompleted();
                },
                get: function () {
                    return this._suggestionValues;
                }
            }
        },
        methods: {
            choosePosition: function() {
                var clientRects = this.getClientRects();
                var maximumHeight = calculateMaximumHeight(this);
                var heigthBeforeAutocomplete = clientRects[0].top;
                var heigthAfterAutocomplete = window.innerHeight - (clientRects[0].top + clientRects[0].height);
                if(maximumHeight < heigthAfterAutocomplete) {
                    this.changeSuggestionsPosition((clientRects[0].top + clientRects[0].height), clientRects[0].left);
                } else if (heigthAfterAutocomplete < heigthBeforeAutocomplete) {
                    this.changeSuggestionsPosition(window.innerHeight - clientRects[0].top, clientRects[0].left, true);
                    constSuggestionsNode.style.height = heigthBeforeAutocomplete + "px";
                } else {
                    this.changeSuggestionsPosition((clientRects[0].top + clientRects[0].height), clientRects[0].left);
                    constSuggestionsNode.style.height = heigthAfterAutocomplete + "px";
                }
            },
            changeSuggestionsPosition: function changeSuggestionsPosition(y, x, booleanTop) {
                constSuggestionsNode.style.top = "";
                constSuggestionsNode.style.bottom = "";
                if(booleanTop) {
                    constSuggestionsNode.style.bottom = y + "px";
                } else {
                    constSuggestionsNode.style.top = y + "px";
                }
                constSuggestionsNode.style.left = x + "px";
            },
            suggest: function (request) {
                if (request) {
                    var regExp = new RegExp('^' + escapeRegExp(request), "i");
                    this.suggestions = this.values.filter(function (value) {
                        if (typeof value === 'object') {
                            for (var key in value) {
                                if (regExp.test(value[key])) {
                                    return true;
                                }
                            }
                            return false;
                        } else {
                            return regExp.test(value);
                        }
                    });
                } else {
                    this.suggestions = this.values;
                }
            },
            getSuggestionNodes: function () {
                return constSuggestionsNode.querySelectorAll('li');
            },
            showSuggestions: function () {
                var suggestionsHtml = this.suggestions.map(function (value) {
                    return '<li class="' + this.suggestionClasses(value) + '">' + this.suggestionTemplate(value) + '</li>';
                }.bind(this)).join('');

                constSuggestionsNode.innerHTML = suggestionsHtml;
                constSuggestionsNode.style.display = 'block';
                //wrapperSuggestionsNode.classList.add('suggestion-display');
            },
            pick: function (selectedNode) {
                if (this.isOpen()) {
                    var selectedValue, selectedIndex;
                    if (selectedNode) {
                        selectedIndex = Array.prototype.indexOf.call(this.getSuggestionNodes(), selectedNode);
                    } else {
                        selectedIndex = this.selectedIndex;
                    }
                    selectedValue = this.suggestions[selectedIndex];

                    this.value = selectedValue;
                    this.suggestions = [selectedValue];

                    this.toggleSuggestions();
                }
            },
            cancel: function () {
                if (this.isOpen()) {
                    //this.value = this._initialValue;

                    this.toggleSuggestions();
                }
            },
            selectPrevious: function () {
                if (this.isOpen() && this.selectedIndex) {
                    this.selectedIndex--;
                }
            },
            selectNext: function () {
                if (this.selectedIndex !== null) {
                    if (this.selectedIndex < this.suggestions.length - 1) {
                        this.selectedIndex++;
                    }
                } else if (!this.isOpen()) {
                    this.search(this._input.value);
                }
            },
            isOpen: function () {
                return constSuggestionsNode.style.display !== 'none';
            },

            toggleSuggestions: function () {
                if (this.isOpen()) {
                    this._selectedIndex = null;
                    constSuggestionsNode.style.display = 'none';
                    //wrapperSuggestionsNode.classList.remove('suggestion-display');
                } else {
                    this.search(this._input.value);
                }
            },
            setFocus: function () {
                this._input.focus();
                this._input.setSelectionRange(0, this._input.value.length);
            }
        },
        events: {
            'keyup': function (e) {
                switch (e.keyCode) {
                    case 13: // Enter
                        this.pick();
                        break;
                    case 27 : // Escape
                        this.cancel();
                        break;
                    case 38: // Up
                        this.selectPrevious();
                        break;
                    case 40: // Down
                        this.selectNext();
                        break;
                    default:
                        this.search(this._input.value);
                }
            },
            'keydown': function (e) {
                switch (e.keyCode) {
                    case 9 :  // Tab
                    case 27 : // Escape
                        this.cancel();
                        break;
                    case 38: // Up
                    case 40: // Down
                        e.preventDefault();
                        break;
                }
            },
            'click:delegate(.x-autocomplete-toggle)': function (e) {
                var that = this.parentNode;
                that.toggleSuggestions();
            },
            'click:delegate(li)': function (e) {
                var autocomplete = this.parentNode.parentNode;
                autocomplete.pick(this);
                e.stopPropagation();
            },
            'mouseover:delegate(li)': function (e) {
                var autocomplete = this.parentNode.parentNode;
                autocomplete.selectedIndex = Array.prototype.indexOf.call(autocomplete.getSuggestionNodes(), this);
            },
            'click': function (e) {
                this.setFocus();
            }
        }
    });

    function calculateMaximumHeight(currentDomXAutoComplete) {
        var domXAutocomplete = document.createElement('x-autocomplete');
        domXAutocomplete.style.visibility = "hidden";
        domXAutocomplete._values = currentDomXAutoComplete._values;
        domXAutocomplete._suggestionValues = currentDomXAutoComplete._values;
        domXAutocomplete.suggestionTemplate = currentDomXAutoComplete.suggestionTemplate;
        domXAutocomplete.suggestionClasses = currentDomXAutoComplete.suggestionClasses;
        document.body.appendChild(domXAutocomplete);
        domXAutocomplete.showSuggestions();
        var maxHeightValue = domXAutocomplete.offsetHeight + constSuggestionsNode.offsetHeight;
        document.body.removeChild(domXAutocomplete);
        return maxHeightValue;
    }

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

})();