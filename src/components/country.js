/**
 * WordPress dependencies
 */
import { TextControl, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../datastore/constants';
import { forwardRef } from '@wordpress/element';

const Country = forwardRef(function Country(props, ref) {
	// Get the name from the state.
	const country_name = useSelect((select) => select(STORE_NAME).getCountryName());

	// Update the state.
	const { setCountry, setSetting } =
		useDispatch(STORE_NAME);

	return (
        <TextControl
            label={__('Country', 'murmurations-node')}
			ref={ref}
            value={country_name ?? ''}
            onChange={(value) => setSetting('country_name', value)}
			help={__('The name of country where the entity is based', 'murmurations-node' )}
        />
	);
});
export default Country;
