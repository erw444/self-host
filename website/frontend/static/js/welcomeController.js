(function(){
  'use strict';
  
  let WelcomeController = function($scope, Blogs){
    var ctrl = this;
    ctrl.blogEntries = [
      {        
        blogTitle: "Website Under Construction",
        blogBody: "Will be posting updates here as I make progress on the website. Stay tuned!"
      }
    ];
    //getBlogs();
    
    function getBlogs() {
    	Blogs.query($scope.model).$promise.then(
	        function(data){
	          ctrl.blogEntries= data;
	        });
    }
  }
  
  WelcomeController.$inject = ['$scope', 'Blogs'];
  angular.module('app').controller('WelcomeController', WelcomeController);
})();
