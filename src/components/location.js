/**
 * WordPress dependencies
 */
import {
	TextControl,
	PanelRow,
	Button,
	PanelBody,
	SelectControl,
	Notice,
	RadioControl,
	SearchControl,
	Dashicon,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../datastore/constants';
import apiFetch from '@wordpress/api-fetch';
import { useRef, forwardRef, useState } from '@wordpress/element';

const Location = () => {
	// Get data from the db.
	const location = useSelect( ( select ) =>
		select( STORE_NAME ).getLocation()
	);
	const locality = useSelect( ( select ) =>
		select( STORE_NAME ).getLocality()
	);
	const region = useSelect( ( select ) => select( STORE_NAME ).getRegion() );
	const country_name = useSelect( ( select ) =>
		select( STORE_NAME ).getCountryName()
	);
	const geolocation =
		useSelect( ( select ) => select( STORE_NAME ).getGeoLocation() ) ?? {};

	const [ isSearching, setIsSearching ] = useState( false );
	const [ resultsArray, setResultsArray ] = useState( ); // results array
	const [ resultsOptions, setResultsOptions ] = useState( false ); //search results
	const [ selectedResults, setSelectedResults ] = useState( false ); //selected option
	const locationInputRef = useRef( '' );
	const localityInputRef = useRef( '' );
	const regionInputRef = useRef( '' );
	const countryInputRef = useRef( '' );
	const latInputRef = useRef( '' );
	const lonInputRef = useRef( '' );
	const resultsInputRef = useRef( '' );

	// Update the state.
	const { setSetting } = useDispatch( STORE_NAME );

	const handleChange = ( key, value ) => {
		const newGeolocation = geolocation;
		newGeolocation[ key ] = value;
		setSetting( 'geolocation', newGeolocation );
	};
	
	const isPostalCode = ( value ) => {
		let hasNum = /\d/. test( value );
		return hasNum;
	}

	const clearSearch = () => {
		setResultsOptions( null )
		console.log( 'clearSearch: ', locationInputRef.current )
		locationInputRef.current.value = ''
		locationInputRef.current.focus()
	}

	// Search OpenMaps API
	const handleSearch = () => {
		setIsSearching( true );
		setResultsOptions( null )
		apiFetch( {
			path: 'murmurations/v2/find/location',
			method: 'POST',
			data: { location },
		} )
			.then( ( response ) => JSON.parse( response.body ) )
			.then( ( body ) => {
				setIsSearching( false );

				if ( ! body.length > 0 ) {
					console.log( 'no results found' );
					setResultsOptions( __( 'No results found', 'murmurations-node' ) )
				} else {
					console.log( body );
					setResultsArray( body ); 
					let results = body.map(
						( item, index ) => (
							{
								'label': item.display_name,
								'value': index 
							})
					)
					setResultsOptions( results.slice( 0, 5 ) )
				}
			} );
	};

	const handleSelect = ( value ) => {

		setSelectedResults( value )
		let selection = resultsArray[value];		
		let locationArr = selection.display_name.split( ', ' );

		// Populate fields
		locationInputRef.current = selection.display_name;
		countryInputRef.current = locationArr.pop();
		let regionOrPostCode = locationArr.pop();
		
		regionInputRef.current = !isPostalCode( regionOrPostCode ) ? regionOrPostCode : locationArr.pop();
		localityInputRef.current = locationArr.join( ', ' ).toString();
		latInputRef.current = selection.lat;
		lonInputRef.current = selection.lon;

		setSetting( 'location', locationInputRef.current );
		setSetting( 'locality', localityInputRef.current );
		setSetting( 'region', regionInputRef.current );
		setSetting( 'country_name', countryInputRef.current );
		handleChange( 'lat', latInputRef.current );
		handleChange( 'lon', lonInputRef.current );
	}

	return (
		<PanelBody className={ 'p-0' }>
			<PanelRow className="justify-inherit mt-10">
				<SearchControl
					label={ __( 'Location', 'murmurations-node' ) }
					hideLabelFromVision={ false }
					ref={ locationInputRef }
					value={ location }
					onChange={ ( value ) => setSetting( 'location', value ) }
					onKeyPress={ ( event ) => {
						if ( event.key === 'Enter' ) {
							handleSearch();
						}
					} }
					// onClose={ () => clearSearch() }
					help={ __(
						'Lookup your location to fill in the values below.',
						'murmurations-node'
					) }
					className={ 'murmurations-search-field' }
				/>
				<Button
					variant="primary"
					icon={ 'search' }
					onClick={ handleSearch }
					className={ 'location-search' }
					disabled={ isSearching }
				>
					{ isSearching ? (
						<>
							{ __( 'Searching...', 'murmurations-node' ) }
							<Spinner />
						</>
					) : (
						__( 'Search', 'murmurations-node' )
					) }
				</Button>
			</PanelRow>
			{ resultsOptions ? (
				typeof resultsOptions === 'object' ?
				<PanelRow>
					<RadioControl
						label={ __( 'Search results', 'murmurations-node' ) }
						help={ __( 'Select a result to populate the location fields', 'murmurations-node' ) }
						selected={ selectedResults }
						options={ resultsOptions }
						onChange={ ( value ) => handleSelect( value ) }
					/>
				</PanelRow>  
				: ( typeof resultsOptions === 'string' ) ? 
					<Notice 
						status='warning'
						isDismissible={ false }
					>
						{ resultsOptions }
					</Notice>
					: '' ) : ''
			}
			<PanelRow className="align-start gap-5">
				<TextControl
					label={ __( 'Locality', 'murmurations-node' ) }
					ref={ localityInputRef }
					value={ locality ?? '' }
					onChange={ ( value ) => setSetting( 'locality', value ) }
					help={ __(
						'The locality (city, town, village, etc.) where the entity is located',
						'murmurations-node'
					) }
				/>
				<TextControl
					label={ __( 'Region', 'murmurations-node' ) }
					ref={ regionInputRef }
					value={ region ?? '' }
					onChange={ ( value ) => setSetting( 'region', value ) }
					help={ __(
						'The region (state, county, province, etc.) where the entity is located',
						'murmurations-node'
					) }
				/>
				<TextControl
					label={ __( 'Country', 'murmurations-node' ) }
					ref={ countryInputRef }
					value={ country_name ?? '' }
					onChange={ ( value ) =>
						setSetting( 'country_name', value )
					}
					help={ __(
						'The name of country where the entity is based',
						'murmurations-node'
					) }
				/>
				<TextControl
					ref={ latInputRef }
					label={ __( 'Latitude', 'murmurations-node' ) }
					value={ geolocation.lat ?? '' }
					onChange={ ( value ) => handleChange( 'lat', value ) }
					help={ __(
						'The geo-coordinates (latitude)',
						'murmurations-node'
					) }
				/>
				<TextControl
					ref={ lonInputRef }
					label={ __( 'Longitude', 'murmurations-node' ) }
					value={ geolocation.lon ?? '' }
					onChange={ ( value ) => handleChange( 'lon', value ) }
					help={ __(
						'The geo-coordinates (longitude)',
						'murmurations-node'
					) }
				/>
			</PanelRow>
		</PanelBody>
	);
};
export default Location;
