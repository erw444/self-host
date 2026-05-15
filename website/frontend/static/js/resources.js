(function(){
  'use strict';
  angular.module('app')
  .factory('Blogs', ['$resource', function($resource) {
    return $resource('/blog', {}, {
      query: {method: 'GET', url: 'http://localhost:8000/blog', isArray: true},
      save: {method: 'PUT', url: 'http://localhost:8000/blog'}
    });
  }]);
})();
