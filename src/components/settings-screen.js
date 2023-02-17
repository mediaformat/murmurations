/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Button, ButtonGroup, ToggleControl, Panel, PanelBody, PanelRow, FormToggle, Spinner } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch, useSelect, coreDataStore } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data'; // do I need this?
import { STORE_NAME } from '../datastore/constants';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import '../datastore/index';
import Name from './name';
import PrimaryUrl from './primary-url';
import Urls from './urls';
import Description from './description';
import Mission from './mission';
import Location from './location';
import Image from './image';
import Tags from './tags';
import Rss from './rss';
import Notifications, { createSuccessNotice, createErrorNotice } from './notifications';
import Env from './env';

const SettingsScreen = () => {
	const { saveEntityRecord, getLastEntitySaveError, hasFinishedResolution, isSavingEntityRecord } = useDispatch('core');
	const [ isRequesting, setIsRequesting ] = useState( false );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isValidating, setIsValidating ] = useState( false );
	const [ isWorking, setIsWorking ] = useState( false );
	const [ isGettingStatus, setIsGettingStatus ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// Gets all settings from the store.
	const { settingsFromState, hasResolved } = useSelect(
		( select ) => {
			return {
				settingsFromState: select(STORE_NAME).getSettings(),
				hasResolved: select(STORE_NAME).hasFinishedResolution(
					'getSettings'
				),
			}
	});

	const handleSave = async () => {
		setIsRequesting(true);
		const success = await saveEntityRecord('root', 'site', {
							'murmurations-node_data':
								settingsFromState,
						} )
		if ( success ) {
			createSuccessNotice( "The settings were saved!", {
				type: 'snackbar',
			} );
			setIsRequesting(false);
		} else {
			const lastError = getLastEntitySaveError( 'root', 'site', {
									'murmurations-node_data':
										settingsFromState,
								} );
			const message = ( lastError?.message || 'There was an error.' ) + ' Please refresh the page and try again.'
			createErrorNotice( message, {
				type: 'snackbar',
			} );
			setIsRequesting(false);
		}
	};
	
	const handleValidate = async () => {
		setIsValidating(true);
		const status = await apiFetch( { path: '/murmurations/v2/index/validate' } ).then( ( posts ) => {
			console.log( posts );
			return posts;
			} )
		if ( ! status.errors ) {
			createSuccessNotice( status.meta.message, {
				type: 'snackbar',
			} );
		} else {
			console.log( status.errors );
			status.errors.forEach( error => {
				createErrorNotice( error.detail, {
					type: 'snackbar',
				} );
			});
		}
		setIsValidating(false);
	};
	
	const handlePublish = async () => {
		setIsPublishing(true);
		const status = await apiFetch( { path: '/murmurations/v2/index/nodes_sync' } ).then( ( posts ) => {
			console.log( posts );
			return posts;
			} )
		if ( ! status.errors ) {
			let responseMessage = `status: ${status.data.status} \n node_id: ${status.data.node_id} \n profile_url: ${status.data.profile_url} \n last_updated: ${status.data.last_updated}`
			createSuccessNotice( responseMessage, {
				type: 'snackbar',
			} );
			setIsPublishing(false);
		} else {
			console.log( status.errors );
			status.errors.forEach( error => {
				let errorMessage = (
				<div>
					<code>{error.status}</code>
					<p><strong>{error.status}</strong></p>
					<p>{error.detail}</p>
				</div>);
				createErrorNotice( __('Server response: ', 'mumurations-node') + error.detail, {
					type: 'snackbar',
				} );
			});
			setIsPublishing(false);
		}
	};

	const handleStatus = async () => {
		setIsGettingStatus(true);
		const status = await apiFetch( { path: '/murmurations/v2/index/node_status' } ).then( ( posts ) => {
			console.log( posts );
			return posts;
			} )
		if ( status.data ) {
			let responseMessage = `status: ${status.data.status} \n node_id: ${status.data.node_id} \n profile_url: ${status.data.profile_url} \n last_updated: ${status.data.last_updated}`;
			createSuccessNotice( responseMessage, {
				type: 'snackbar',
			} );
		} else {
			console.log( status );
			createErrorNotice( status, {
				type: 'snackbar',
			} );
		}
		setIsGettingStatus( false );
	};

	const handleSaveAndPublish = async () => {
		setIsWorking(true);
		handleSave()
		handleValidate()
		handlePublish()
		setIsWorking(false);
	};

	if ( ! hasResolved ) {
		return <Spinner />;
	}

	return (
		<div className="wrap">
			<Panel header="Murmurations settings">
				<PanelBody>
					<Name />
					<PrimaryUrl />
					<Urls />
					<Description />
					<Mission />
					<Image />
					<Tags />
					<Rss />
					<Location />
					<Env/>
					<PanelRow>
						<Button variant="primary" onClick={ handleSaveAndPublish } disabled={ isWorking } >
							{ isWorking ? (
								<>
									{ __( 'Saving & Publishing...', 'murmurations-node') }
									<Spinner/>
								</>
							) : __( 'Save & Publish', 'murmurations-node') }
						</Button>
						<Notifications></Notifications>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
};

export default SettingsScreen;

