/**
 * Provides a generic module for interacting with entities via our REST API
 */
(function () {

  var restPath = '';

  angular.module('EntityService', [])
  /**
   * Service to maintain the list of files on a user's site
   */
    .factory('EntityService', ['$rootScope', '$http', function ($rootScope, $http) {

      var factory = function (entityType, idProp) {
        var type = entityType;
        var entities = {};
        var entityCount = 0;
        var eventName = 'EntityService.'+type;
        var errorAttempts = 0;

        if (!restPath) {
          restPath = Drupal.settings.paths.api;
        }

        var success = function(resp) {
          for (var i=0; i<resp.data.length; i++) {
            var id = resp.data[i][idProp];
            entities[id] = resp.data[i];
          }
          entityCount = resp.count;
          $rootScope.$broadcast(eventName+'.getAll', entities);
        }

        var errorFunc = function() {
          errorAttempts++;
          if (errorAttempts < 3) {
            $http.get({url: restPath}).
              success(success).
              error(errorFunc);
          }
        }

        $http.get(restPath+'/'+entityType)
          .success(success)
          .error(errorFunc);

        this.getAll = function () {
          return entities;
        }

        this.get = function (id) {
          if (entities[id]) {
            return entities[id];
          }
          throw new Exception('Entity of type '+type+' with id '+id+' not found.');
        }

        this.getCount = function () {
          return entityCount;
        }

        this.add = function (entity) {
          if (entities[entity[idProp]]) {
            throw new Exception('Cannot add entity of type '+type+' that already exists.');
          }
          entities[entity[idProp]] = entity;
          // rest API call to add entity to server

          $rootScope.$broadcast(eventName+'.add', entity);
        };

        this.edit = function (entity) {
          if (!entities[entity[idProp]]) {
            this.add(entity);
            return;
          }
          entities[entity[idProp]] = entity;
          // rest API call to update entity on server

          $rootScope.$broadcast(eventName+'.update');
        };

        this.delete = function (entity) {
          var id = entity[idProp];
          delete entities[id];

          //rest API call to delete entity from server

          $rootScope.$broadcast(eventName+'.delete');
        }
      }

      return factory;
    }]);
})();