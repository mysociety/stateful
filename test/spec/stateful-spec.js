// https://jasmine.github.io/api/edge/matchers.html

var helper = {
  dom: {
    new: function() {
      $('#stage').remove();
      // return $('<div id="stage">').hide().appendTo('body');
      return $('<div id="stage">').appendTo('body');
    },
    get: function() {
      return $('#stage');
    },
    find: function( selector ) {
      return $('#stage').find(selector);
    }
  },
  localStorage: {
    get: function( key ) {
      var state = JSON.parse( window.localStorage.getItem('state') || '{}' );
      console.log( 'helper.localStorage.get(', key, ') =', state );
      if ( typeof key !== 'undefined' ) {
        return state[ key ];
      } else {
        return state;
      }
    },
    update: function( key, value ) {
      var state = JSON.parse( window.localStorage.getItem('state') || '{}' );
      if ( typeof value === 'undefined' ) {
        delete state[ key ];
      } else {
        state[ key ] = value;
      }
      window.localStorage.setItem( 'state', JSON.stringify(state) );
    },
    clear: function() {
      window.localStorage.removeItem( 'state' );
    }
  }
};

describe("window.Stateful()", function() {

  it("should be defined", function() {
    expect(window.Stateful).toBeDefined();
  });

});

describe('Given a [data-st8-key] input on the page before initialisation', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('key2', 'value2');
    helper.localStorage.update('key3', 'value3-overwritten');

    var dom = helper.dom.new();
    dom.append('<input type="text" data-st8-key="key1" value="value1">');
    dom.append('<input type="text" data-st8-key="key2">');
    dom.append('<input type="text" data-st8-key="key3" value="value3-original">');
    dom.append('<input type="text" data-st8-key="key4">');
    dom.append('<input type="text" data-st8-key="key5" value="value5-original">');
    dom.append('<input type="hidden" data-st8-key="key5">');
    dom.append('<input type="text" data-st8-key="key6" value="value6-original">');
    dom.append('<input type="hidden" data-st8-key="key6">');

    stateful = new Stateful({ root: dom });
  });

  describe('if the input has a value for that key, but the stateful store does not', function() {
    it('the input value is saved into the stateful store', function() {
      expect( helper.localStorage.get('key1') ).toBe('value1');
    });
  });

  describe('if the stateful store has a value for that key, but the input does not', function() {
    it('the input value is set from the stateful store value', function() {
      expect( helper.dom.find('[data-st8-key="key2"]').val() ).toBe('value2');
    });
  });

  describe('if both the stateful store and the input have competing values for that key', function() {
    it('the stored value take precedence – the input value is overwritten to match', function() {
      expect( helper.dom.find('[data-st8-key="key3"]').val() ).toBe('value3-overwritten');
    });
  });

  describe('if neither the input nor the stateful store have a value for that key', function() {
    it('neither the input nor the stateful store are changed', function() {
      expect( helper.dom.find('[data-st8-key="key4"]').val() ).toBeFalsy();
      expect( helper.localStorage.get('key4') ).toBeUndefined();
    });
  });

  describe('when a change event is detected on the input', function() {
    beforeAll(function() {
      helper.dom.find('[data-st8-key="key5"][type="text"]').val('value5-updated').trigger('change');
    });

    it('its new value is saved into the stateful store', function() {
      expect( helper.localStorage.get('key5') ).toBe('value5-updated');
    });
    it('the new value is applied to other elements with the same [data-st8-key]', function() {
      expect( helper.dom.find('[data-st8-key="key5"][type="hidden"]').val() ).toBe('value5-updated');
    });
  });

  describe('when the stateful store is updated through updateState() followed by applyState()', function() {
    beforeAll(function() {
      stateful.updateState('key6', 'value6-updated');
      stateful.applyState();
    });

    it('the input changes to reflect the updated value from the stateful store', function() {
      expect( helper.dom.find('[data-st8-key="key6"][type="text"]').val() ).toBe('value6-updated');
    });
    it('the new value is applied to other elements with the same [data-st8-key]', function() {
      expect( helper.dom.find('[data-st8-key="key6"][type="hidden"]').val() ).toBe('value6-updated');
    });
  });
});

describe('Given a [data-st8-key] input added to the page after initialisation', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();

    var dom = helper.dom.new();

    stateful = new Stateful({ root: dom });

    dom.append('<input type="text" data-st8-key="key1" value="value1-original">');
    dom.append('<input type="hidden" data-st8-key="key1">');
    dom.append('<input type="text" data-st8-key="key2" value="value2-original">');
    dom.append('<input type="hidden" data-st8-key="key2">');
  });

  describe('when a change event is detected on the input', function() {
    beforeAll(function() {
      helper.dom.find('[data-st8-key="key1"][type="text"]').val('value1-updated').trigger('change');
    });

    it('its new value is saved into the stateful store', function() {
      expect( helper.localStorage.get('key1') ).toBe('value1-updated');
    });
    it('the new value is applied to other elements with the same [data-st8-key]', function() {
      expect( helper.dom.find('[data-st8-key="key1"][type="hidden"]').val() ).toBe('value1-updated');
    });
  });

  describe('when the stateful store is updated through updateState()', function() {
    beforeAll(function() {
      stateful.updateState('key2', 'value2-updated');
      stateful.applyState();
    });

    it('the input changes to reflect the updated value from the stateful store', function() {
      expect( helper.dom.find('[data-st8-key="key2"][type="text"]').val() ).toBe('value2-updated');
    });
    it('the new value is applied to other elements with the same [data-st8-key]', function() {
      expect( helper.dom.find('[data-st8-key="key2"][type="hidden"]').val() ).toBe('value2-updated');
    });
  });
});

describe('Given an element with a [data-st8-show-if-set] attribute', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();

    var dom = helper.dom.new();

    dom.append('<input type="checkbox" data-st8-key="conditional1" id="input1" value="value1">');
    dom.append('<input type="checkbox" data-st8-key="conditional1" id="input2" value="value1">');
    dom.append('<div data-st8-key="conditional1" data-st8-show-if-set>Conditional 1</div>');

    dom.append('<input type="checkbox" data-st8-key="conditional2" id="input3" value="value3">');
    dom.append('<input type="checkbox" data-st8-key="conditional2" id="input4" value="value3">');
    dom.append('<div data-st8-key="conditional2" data-st8-show-if-set>Conditional 2</div>');

    dom.append('<input type="checkbox" data-st8-key="conditional3" id="input5" value="value5" checked>');
    dom.append('<input type="checkbox" data-st8-key="conditional3" id="input6" value="value5" checked>');
    dom.append('<div data-st8-key="conditional3" data-st8-show-if-set>Conditional 3</div>');

    stateful = new Stateful({ root: dom });
  });

  it('the element is given an auto-generated id attribute, if it didn’t have one already', function() {
    expect( helper.dom.find('div[data-st8-key="conditional1"]').attr('id') ).toBeDefined();
  });

  it('all inputs with the same [data-st8-key] are given an aria-controls attribute', function() {
    var id = helper.dom.find('div[data-st8-key="conditional1"]').attr('id');
    expect( helper.dom.find('#input1').attr('aria-controls') ).toBeDefined();
    expect( helper.dom.find('#input1').attr('aria-controls') ).toBe(id);
    expect( helper.dom.find('#input2').attr('aria-controls') ).toBeDefined();
    expect( helper.dom.find('#input2').attr('aria-controls') ).toBe(id);
  });

  it('all inputs with the same [data-st8-key] are given an aria-expanded attribute', function() {
    expect( helper.dom.find('#input1').attr('aria-expanded') ).toBeDefined();
    expect( helper.dom.find('#input2').attr('aria-expanded') ).toBeDefined();
  });

  describe('when an input with the same [data-st8-key] is checked', function() {
    beforeAll(function(){
      helper.dom.find('#input3').trigger('click');
    });

    it('the element has its aria-hidden attribute set to false', function() {
      expect( helper.dom.find('div[data-st8-key="conditional2"]').attr('aria-hidden') ).toBe('false');
    });

    it('the element is shown', function() {
      expect( helper.dom.find('div[data-st8-key="conditional2"]').css('display') ).not.toBe('none');
    });

    it('all inputs with the same [data-st8-key] have their aria-expanded attribute set to true', function() {
      expect( helper.dom.find('#input3').attr('aria-expanded') ).toBe('true');
      expect( helper.dom.find('#input4').attr('aria-expanded') ).toBe('true');
    });

    it('all inputs with the same [data-st8-key] become checked', function() {
      expect( helper.dom.find('#input3').prop('checked') ).toBe(true);
      expect( helper.dom.find('#input4').prop('checked') ).toBe(true);
    });
  });

  describe('when an input with the same [data-st8-key] is unchecked', function() {
    beforeAll(function(){
      helper.dom.find('#input5').trigger('click');
    });

    it('the element has its aria-hidden attribute set to true', function() {
      expect( helper.dom.find('div[data-st8-key="conditional3"]').attr('aria-hidden') ).toBe('true');
    });

    it('the element is hidden', function() {
      expect( helper.dom.find('div[data-st8-key="conditional3"]').css('display') ).toBe('none');
    });

    it('all inputs with the same [data-st8-key] have their aria-expanded attribute set to false', function() {
      expect( helper.dom.find('#input5').attr('aria-expanded') ).toBe('false');
      expect( helper.dom.find('#input6').attr('aria-expanded') ).toBe('false');
    });

    it('all inputs with the same [data-st8-key] become unchecked', function() {
      expect( helper.dom.find('#input5').prop('checked') ).toBe(false);
      expect( helper.dom.find('#input6').prop('checked') ).toBe(false);
    });
  });
});

describe('Given an element with a [data-st8-hide-if-set] attribute', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('conditional1', 'value1');

    var dom = helper.dom.new();

    dom.append('<div data-st8-key="conditional1" data-st8-hide-if-set>Conditional 1</div>');
    dom.append('<div data-st8-key="conditional2" data-st8-hide-if-set>Conditional 2</div>');

    stateful = new Stateful({ root: dom });
  });

  it('the element is hidden when its key appears in the state', function() {
    expect( helper.dom.find('div[data-st8-key="conditional1"]').attr('aria-hidden') ).toBe('true');
  });

  it('the element is shown when its key does not appear in the state', function() {
    expect( helper.dom.find('div[data-st8-key="conditional2"]').attr('aria-hidden') ).toBe('false');
  });

});

describe('Given an element with a [data-st8-show-if-value] attribute', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('key1', 'value1');

    var dom = helper.dom.new();

    dom.append('<div data-st8-key="key1" data-st8-show-if-value="value1">Value 1</div>');
    dom.append('<div data-st8-key="key1" data-st8-show-if-value="value2">Value 2</div>');

    stateful = new Stateful({ root: dom });
  });

  it('the element is shown when the state matches its [data-st8-key-show-if-value] attribute', function() {
    expect( helper.dom.find('div[data-st8-show-if-value="value1"]').attr('aria-hidden') ).toBe('false');
  });

  it('the element is hidden when the state does not match its [data-st8-key-show-if-value] attribute', function() {
    expect( helper.dom.find('div[data-st8-show-if-value="value2"]').attr('aria-hidden') ).toBe('true');
  });

});

describe('Given an element with a [data-st8-hide-if-value] attribute', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('key1', 'value1');

    var dom = helper.dom.new();

    dom.append('<div data-st8-key="key1" data-st8-hide-if-value="value1">Value 1</div>');
    dom.append('<div data-st8-key="key1" data-st8-hide-if-value="value2">Value 2</div>');

    stateful = new Stateful({ root: dom });
  });

  it('the element is hidden when the state matches its [data-st8-key-hide-if-value] attribute', function() {
    expect( helper.dom.find('div[data-st8-hide-if-value="value1"]').attr('aria-hidden') ).toBe('true');
  });

  it('the element is shown when the state does not match its [data-st8-key-show-if-value] attribute', function() {
    expect( helper.dom.find('div[data-st8-hide-if-value="value2"]').attr('aria-hidden') ).toBe('false');
  });

});

describe('Given an element with a [data-st8-show-unless-value] attribute or [data-st8-hide-unless-value] attribute', function() {
  var stateful;

  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('key1', 'value1');

    var dom = helper.dom.new();

    dom.append('<div data-st8-key="key1" data-st8-show-unless-value="value1">Not value 1</div>');
    dom.append('<div data-st8-key="key1" data-st8-show-unless-value="value2">Not value 2</div>');
    dom.append('<div data-st8-key="key1" data-st8-hide-unless-value="value1">Not value 1</div>');
    dom.append('<div data-st8-key="key1" data-st8-hide-unless-value="value2">Not value 2</div>');

    stateful = new Stateful({ root: dom });
  });

  it('the element is hidden when it should be', function() {
    expect( helper.dom.find('div[data-st8-show-unless-value="value1"]').attr('aria-hidden') ).toBe('true');
    expect( helper.dom.find('div[data-st8-hide-unless-value="value2"]').attr('aria-hidden') ).toBe('true');
  });

  it('the element is shown it should be', function() {
    expect( helper.dom.find('div[data-st8-show-unless-value="value2"]').attr('aria-hidden') ).toBe('false');
    expect( helper.dom.find('div[data-st8-hide-unless-value="value1"]').attr('aria-hidden') ).toBe('false');
  });

});

describe('The state of', function() {
  beforeAll(function() {
    helper.localStorage.clear();
    helper.localStorage.update('key2', 'value2');
    helper.localStorage.update('key4', 'value4');
    helper.localStorage.update('key6', 'value6');
    helper.localStorage.update('key8', 'value8b');
    helper.localStorage.update('key10', 'value10');
    helper.localStorage.update('key12', 'value12c');
    helper.localStorage.update('key14', ['value14b', 'value14c']);
    helper.localStorage.update('key16', 'value16-overwritten');

    var dom = helper.dom.new();
    dom.append('<input type="text" data-st8-key="key1" value="value1">');
    dom.append('<input type="text" data-st8-key="key2">');
    dom.append('<input type="hidden" data-st8-key="key3" value="value3">');
    dom.append('<input type="hidden" data-st8-key="key4">');
    dom.append('<textarea data-st8-key="key5">value5</textarea>');
    dom.append('<textarea data-st8-key="key6"></textarea>');
    dom.append('<input type="radio" data-st8-key="key7" name="key7" value="value7a" checked>');
    dom.append('<input type="radio" data-st8-key="key7" name="key7" value="value7b">');
    dom.append('<input type="radio" data-st8-key="key8" name="key8" value="value8a">');
    dom.append('<input type="radio" data-st8-key="key8" name="key8" value="value8b">');
    dom.append('<input type="checkbox" data-st8-key="key9" value="value9" checked>');
    dom.append('<input type="checkbox" data-st8-key="key10" value="value10">');
    dom.append('<select data-st8-key="key11"><option value="value11a">A</option><option value="value11b" selected>B</option><option value="value11c">C</option></select>');
    dom.append('<select data-st8-key="key12"><option value="value12a">A</option><option value="value12b">B</option><option value="value12c">C</option></select>');
    dom.append('<select data-st8-key="key13" multiple><option value="value13a" selected>A</option><option value="value13b" selected>B</option><option value="value13c">C</option></select>');
    dom.append('<select data-st8-key="key14" multiple><option value="value14a">A</option><option value="value14b">B</option><option value="value14c">C</option></select>');
    dom.append('<span data-st8-key="key15">value15</span>');
    dom.append('<span data-st8-key="key16">value16-original</span>');

    new Stateful({ root: dom });
  });

  describe('text inputs', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key1') ).toBe('value1');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key2"]').val() ).toBe('value2');
    });
  });

  describe('hidden inputs', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key3') ).toBe('value3');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key4"]').val() ).toBe('value4');
    });
  });

  describe('textareas', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key5') ).toBe('value5');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key6"]').val() ).toBe('value6');
    });
  });

  describe('radio buttons', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key7') ).toBe('value7a');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key8"]:checked').val() ).toBe('value8b');
    });
  });

  describe('checkboxes', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key9') ).toBe('value9');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key10"]:checked').val() ).toBe('value10');
    });
  });

  describe('selects', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key11') ).toBe('value11b');
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key12"]').val() ).toBe('value12c');
    });
  });

  describe('muliple selects', function() {
    it('can be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key13') ).toEqual(['value13a', 'value13b']);
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key14"]').val() ).toEqual(['value14b', 'value14c']);
    });
  });

  describe('non-form elements (like spans, paragraphs, divs)', function() {
    it('CANNOT be read from the DOM into storage', function() {
      expect( helper.localStorage.get('key15') ).toBeUndefined();
    });
    it('can be applied from storage into the DOM', function() {
      expect( helper.dom.find('[data-st8-key="key16"]').html() ).toEqual('value16-overwritten');
    });
  });
});
