;(function(global) {

  "use strict";

  var window = global;
  var $ = global.jQuery;
  var defaults = {
    root: global.document
  };

  /**
  * @constructor
  * @param {Object} [options] - optional object of settings to override defaults
  * @suppress {missingProperties}
  */
  function Stateful(options) {
    this.settings = $.extend( {}, defaults, options );
    this.init();
  }

  /**
  * Is the given thing defined?
  * @param {*} thing - the thing you want to test
  * @returns {boolean}
  */
  var defined = function defined(thing){
    return ( typeof thing !== 'undefined' );
  };

  /**
  * Does a given HTML element have any data-st8-* attributes, aside from data-st8-key?
  * @param {Object} $el - jQuery object containing the element you want to test
  * @returns {boolean}
  */
  var hasStatefulAttributes = function hasStatefulAttributes($el) {
    return $el.is('[data-st8-show-if-set], [data-st8-hide-if-set], [data-st8-show-if-value], [data-st8-hide-if-value], [data-st8-show-unless-value], [data-st8-hide-unless-value]');
  };

  /**
  * Does a given HTML element have any data-st8-* attributes that affect visibility?
  * @param {Object} $el - jQuery object containing the element you want to test
  * @returns {boolean}
  */
  var hasConditionalVisibility = function hasConditionalVisibility($el) {
    return $el.is('[data-st8-show-if-set], [data-st8-hide-if-set], [data-st8-show-if-value], [data-st8-hide-if-value], [data-st8-show-unless-value], [data-st8-hide-unless-value]');
  }

  /**
  * Show or hide an element, based on the truthiness of the second parameter.
  * @param {Object} $el - jQuery object containing the element you want to show or hide
  * @param {boolean} show - whether the element should be visible
  * @returns {Object} $el
  */
  var setVisibility = function setVisibility($el, show) {
    var key = $el.attr('data-st8-key');
    var id = $el.attr('id');
    $el.attr('aria-hidden', show ? 'false' : 'true');

    $('[data-st8-key="' + key + '"][aria-controls]').filter(function(){
      // The aria-controls attribute can be a space-separated list of IDs,
      // so we need to split and test the attribute value manually.
      var ids = $(this).attr('aria-controls').split(' ');
      return ids.indexOf(id) > -1;
    }).attr('aria-expanded', show ? 'true' : 'false');

    return $el;
  }

  /**
   * Append a new Stateful stylesheet to the given element.
   * @param {Object} $el - jQuery object containing the element to append the stylesheet to
   */
  var addStylesheet = function addStylesheet($el) {
    var $body = $el.find('body');
    if ( $body.length ) {
      $el = $body;
    }
    $el.append('<style type="text/css">[data-st8-key][aria-hidden="true"]{display:none !important;}</style>');
  }

  $.extend(Stateful.prototype, {

    init: function(){
      var _ = this;
      var $doc = $(_.settings.root);
      var uniqueID = 0;

      if ( $doc.data('stateful-init') ) {
        // Stateful has already been initiated on this page.
        // No need to do it again.
        return true;
      } else {
        $doc.data('stateful-init', true);
      }

      addStylesheet($doc);

      // If there are inputs currently on the page, that we don't have
      // stored values for, then suck them up into the stored state.
      $('[data-st8-key]').each(function(){
        var state = _.getState();
        var $el = $(this);
        var key = $el.attr('data-st8-key');

        if ( defined(state[key]) ) {
          // Already have a stored state for this input. Ignore for now.
          // The DOM will get updated by the _.applyState() at the end of init.
          return true;
        }

        if ( $el.is('input[type="radio"], input[type="checkbox"]') ) {
          if ( $el.prop('checked') ) {
            _.updateState( key, $el.val() );
          }

        } else if ( $el.is('select[multiple]') ) {
          if ( $el.val() ) {
            _.updateState( key, $el.val() );
          }

        } else if ( $el.is('input, textarea, select') ) {
          if ( $el.val() ) {
            _.updateState( key, $el.val() );
          }

        }

      });

      // Set up accessibility helpers on conditional elements.
      $('[data-st8-key]').each(function() {
        var $el = $(this);
        var key = $el.attr('data-st8-key');

        if ( hasConditionalVisibility($el) ) {
          // Elements that are to be shown/hidden need a unique ID,
          // so they can be referenced by an aria-controls.
          var id = $el.attr('id') || 'st8-conditional-' + (uniqueID + 1);

          // We explicitly cast the id to a string, to avoid a
          // JSC_TYPE_MISMATCH warning from Closure Compiler. It doesn’t
          // know that $.attr('id') always returns a string when called
          // with just a single argument, and instead thinks that it could
          // be a jQuery object, which $.attr(key, value) doesn’t support.
          id = '' + id;

          $el.attr('id', id);

          // Find all of the other elements that "control" the visibility
          // of element $el, and set their aria attributes.
          $('[data-st8-key="' + key + '"]').filter('input, textarea, select').each(function() {
            // Theoretically, aria-controls can contain multiple IDs
            // as a space-separated "ID reference list", if the element
            // controls more than one other element.
            if ( $(this).attr('aria-controls') ) {
              $(this).attr('aria-controls', $(this).attr('aria-controls') + ' ' + id);
            } else {
              $(this).attr('aria-controls', '' + id);
            }
          });
        }
      });

      // Listen for changes to any current or future inputs.
      $doc.on('change', '[data-st8-key]', function(){
        var $el = $(this);
        var key = $el.attr('data-st8-key');

        if ( $el.is('input[type="radio"], input[type="checkbox"]') ) {
          if ( $el.prop('checked') ) {
            _.updateState( key, $el.val() );
          } else {
            _.updateState( key );
          }

        } else if ( $el.is('input, textarea, select') ) {
          var val = $el.val();
          if ( val ) {
            _.updateState( key, val);
          } else {
            _.updateState( key );
          }
        }

        // Update (this and) other elements with the same key.
        _.applyState(key);
      });

      // Init complete. Apply any stored state to elements on the page.
      _.applyState();

    },

    /**
    * Retrieve the given key from the state, or if no key is provided,
    * retrieve the entire state as an object.
    * @param {string} [key] - optional key
    */
    getState: function( key ) {
      var _ = this;
      var state = JSON.parse( window.localStorage.getItem('state') || '{}' );

      if ( defined(key) ) {
        return state[ key ];
      } else {
        return state;
      }
    },

    /**
    * Update the state, setting the given key to the given value.
    * If the value is not provided, or is undefined, then the key
    * will be removed from the state.
    * @param {string} key - key to update or delete
    * @param {string} [value] - optional value
    */
    updateState: function( key, value ) {
      var _ = this;
      var state = _.getState();

      if ( ! defined(value) ) {
        delete state[ key ];
      } else {
        state[ key ] = value;
      }

      window.localStorage.setItem( 'state', JSON.stringify(state) );
    },

    /**
    * Clear the entire state.
    */
    clearState: function() {
      var _ = this;
      window.localStorage.setItem( 'state', '{}' );
    },

    /**
    * Apply the current state to any stateful elements on the page.
    * If a key is provided, only elements with that key will be updated.
    * @param {string} [key] - optional key
    */
    applyState: function(key) {
      var _ = this;
      var selector = '[data-st8-key]';

      if ( typeof key === 'string' ) {
        selector = '[data-st8-key="' + key + '"]';
      }

      $(selector).each(function(){
        var state = _.getState();
        var $el = $(this);
        var key = $el.attr('data-st8-key');

        if ( $el.is('input[type="radio"], input[type="checkbox"]') ) {
          var bool = defined(state[key]) && state[key] == $el.val();
          $el.prop('checked', bool);

        } else if ( $el.is('select[multiple]') ) {
          $el.val( state[key] ? state[key] : null );

        } else if ( $el.is('input, textarea, select') ) {
          $el.val( state[key] ? state[key] : null );

        } else if ( ! hasStatefulAttributes($el) ) {
          $el.text( state[key] ? state[key] : '' );

        }

        if ( $el.is('[data-st8-show-if-set]') ) {
          setVisibility( $el, defined(state[key]) );
        } else if ( $el.is('[data-st8-hide-if-set]') ) {
          setVisibility( $el, ! defined(state[key]) );
        } else if ( $el.is('[data-st8-show-if-value]') ) {
          setVisibility( $el, state[key] == $el.attr('data-st8-show-if-value') );
        } else if ( $el.is('[data-st8-hide-if-value]') ) {
          setVisibility( $el, state[key] != $el.attr('data-st8-hide-if-value') );
        } else if ( $el.is('[data-st8-show-unless-value]') ) {
          setVisibility( $el, state[key] != $el.attr('data-st8-show-unless-value') );
        } else if ( $el.is('[data-st8-hide-unless-value]') ) {
          setVisibility( $el, state[key] == $el.attr('data-st8-hide-unless-value') );
        }
      });
    }

  });

  window.Stateful = Stateful;

})(window);
