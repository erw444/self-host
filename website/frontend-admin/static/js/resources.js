(function(){
  'use strict';
  angular.module('app')
  .factory('Blogs', ['$resource', function($resource) {
    return $resource('/blog', {}, {
      query: {method: 'GET', url: 'https://localhost:8000/blog', isArray: true},
      save: {method: 'PUT', url: 'https://localhost:8000/blog'}
    });
  }]);
})();
