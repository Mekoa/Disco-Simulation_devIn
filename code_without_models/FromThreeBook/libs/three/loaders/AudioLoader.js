/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.AudioLoader = ( function () {

	function AudioLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.path = '';
		this.requestHeader = {};
		this.withCredentials = false;

	}

	AudioLoader.prototype = {

		constructor: AudioLoader,

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var loader = new THREE.FileLoader( scope.manager );
			loader.setResponseType( 'arraybuffer' );
			loader.setPath( this.path );
			loader.setRequestHeader( this.requestHeader );
			loader.setWithCredentials( this.withCredentials );
			loader.load( url, function ( buffer ) {

				try {

					// Create a copy of the buffer. The `decodeAudioData` method
					// detaches the buffer when complete, preventing reuse.
					var bufferCopy = buffer.slice( 0 );

					var context = THREE.AudioContext.getContext();
					context.decodeAudioData( bufferCopy, function ( audioBuffer ) {

						onLoad( audioBuffer );

					} ).catch( handleError );

				} catch ( e ) {

					handleError( e );

				}

			}, onProgress, onError );

			function handleError( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		},

		setPath: function ( value ) {

			this.path = value;

			return this;

		},

		setRequestHeader: function ( value ) {

			this.requestHeader = value;

			return this;

		},

		setWithCredentials: function ( value ) {

			this.withCredentials = value;

			return this;

		}

	};

	return AudioLoader;

} )();