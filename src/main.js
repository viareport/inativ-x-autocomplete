(function(){

    xtag.register('x-autocomplete', {
        lifecycle: {
            created: function created() {
                this._input = document.createElement('input');
                this._input.setAttribute('type', 'text');
                this.appendChild(this._input);

                this._toggleSuggestions = document.createElement('span');
                this._toggleSuggestions.className = 'x-autocomplete-toggle';
                this.appendChild(this._toggleSuggestions);

                this._suggestionsNode = document.createElement('ul');
                this._suggestionsNode.style.display = 'none';
                this.appendChild(this._suggestionsNode);

                this._selectedIndex = null;


                // default search method (needs this.values being set)
                this.search = this.suggest;

                //default template
                this.suggestionTemplate = function(value) {
                    return value;
                };

                //default classes
                this.suggestionClasses = function(value) {
                    return '';
                };

                this._onSearchCompleted = function() {
                    if (this.suggestions.length) {
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
                        this.showSuggestions();
                    }
                }.bind(this);

                this._clickOutsideListener = function _clickOutsideListener(e) {
                    if (this.isOpen() && this !== e.target && ! this.contains(e.target)) {
                        this.toggleSuggestions();
                    }
                }.bind(this);
            },
            inserted: function inserted() {
                window.document.addEventListener('click', this._clickOutsideListener, false);
            },
            removed: function removed() {
                window.document.removeEventListener('click', this._clickOutsideListener, false);
            },
            attributeChanged: function attributedChanged(attribute) {

            }
        },
        accessors: {
            values: {
                set: function(values) {
                    this._values = values;
                    this._suggestionValues = values;
                },
                get: function() {
                    return this._values;
                }
            },

            value: {
                set: function(value) {
                    this._value = value;
                    this._input.value = this.suggestionTemplate(value);

                    this.dispatchEvent(new CustomEvent('valueChanged', {
                        detail: {newValue: value},
                        bubbles: false
                    }));
                },
                get: function() {
                    return this._value;
                }
            },

            selectedIndex: {
                set: function(selectedIndex) {
                    if(this._selectedIndex !== null && this.getSuggestionNodes()[this._selectedIndex]) {
                        this.getSuggestionNodes()[this._selectedIndex].classList.remove('x-autocomplete-selected');
                    }
                    this._selectedIndex = selectedIndex;
                    var selectedNode = this.getSuggestionNodes()[this._selectedIndex];
                    selectedNode.classList.add('x-autocomplete-selected');
                },
                get: function() {
                    return this._selectedIndex;
                }
            },
            suggestions: {
                set: function(values) {
                    this._suggestionValues = values;
                    this._onSearchCompleted();
                },
                get: function() {
                    return this._suggestionValues;
                }
            }
        },
        methods: {

            suggest: function(request) {
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

            getSuggestionNodes: function() {
                return this._suggestionsNode.querySelectorAll('li');
            },

            showSuggestions: function() {

                this._suggestionsNode.innerHTML = this.suggestions.map(function(value) {
                    return '<li class="'+ this.suggestionClasses(value)+'">' + this.suggestionTemplate(value) + '</li>';
                }.bind(this)).join('');

                this._suggestionsNode.style.display = 'block';
            },
            pick: function(selectedNode) {
                if(this.isOpen()) {
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
            cancel: function() {
                if(this.isOpen()) {
                    //this.value = this._initialValue;

                    this.toggleSuggestions();
                }
            },
            selectPrevious: function() {
                if(this.isOpen() && this.selectedIndex) {
                    this.selectedIndex--;
                }
            },
            selectNext: function() {
                if(this.selectedIndex !== null) {
                    if(this.selectedIndex < this.suggestions.length -1) {
                        this.selectedIndex++;
                    }
                } else if (! this.isOpen()) {
                    this.search(this._input.value);
                }
            },
            isOpen: function() {
                return this._suggestionsNode.style.display !== 'none';
            },

            toggleSuggestions: function() {
                if(this.isOpen()) {
                    this._selectedIndex = null;
                    this._suggestionsNode.style.display = 'none';
                } else {
                    this.search(this._input.value);
                }
            }
        },
        events: {
            'keyup' : function(e) {
                switch(e.keyCode) {
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
            'keydown' : function(e) {
                switch(e.keyCode) {
                case 9 :  // Tab
                    this.cancel();
                    break;
                case 38: // Up
                case 40: // Down
                    e.preventDefault();
                    break;
                }
            },
            'click:delegate(.x-autocomplete-toggle)' : function(e) {
                var that = this.parentNode;
                that.toggleSuggestions();
            },
            'click:delegate(li)' : function(e) {
                var autocomplete = this.parentNode.parentNode;
                autocomplete.pick(this);
                e.stopPropagation();
            },
            'mouseover:delegate(li)' : function(e) {
                var autocomplete = this.parentNode.parentNode;
                autocomplete.selectedIndex = Array.prototype.indexOf.call(autocomplete.getSuggestionNodes(), this);
            },
            'click' : function(e) {
                var input = this._input;
                input.focus();
                input.setSelectionRange(0, input.value.length);                         
            }
        }
    });


    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

})();