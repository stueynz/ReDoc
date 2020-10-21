import styled from '../../styled-components';
import * as React from 'react';

export const ScopesDialog = styled.div`
    ${({ theme }) => `
        width: 85%;
        margin-left: 1em;
        font-family: "Courier New";
        display: block;
        color: ${theme.colors.primary.main};
        font-weight: bolder;
        border-bottom: 1px solid #ccc;
        padding: 5px 0;
    `};
`;


export const ScopeLabel = styled.label`
    cursor: pointer;
`;

const Checkbox = styled.input`
    ${({ theme }) => `
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        cursor: pointer;

        /* create custom checkbox appearance */
        display: inline-block;
        width: 20px;
        height: 20px;
        padding: 3px;

        /* background-color only for content */
        background-clip: content-box;
        border: 2px solid ${theme.colors.primary.main};
        border-radius: 6px;
        background-color: #e7e6e7;
        margin-left: 15px;
        margin-right: 10px;
        margin-bottom: -6px;

        &:checked{
            background-color: ${theme.colors.primary.main};
        }

        &:focus{
            outline: none !important;
        }
    `};
`;

export const ScopeOption = ({ label, isSelected, onCheckboxChange }) => (
    <div>
        <ScopeLabel>
            <Checkbox
                type="checkbox"
                name={label}
                checked={isSelected}
                onChange={onCheckboxChange}
                className="form-check-input"
            />
            {label}
        </ScopeLabel>
    </div>
);
