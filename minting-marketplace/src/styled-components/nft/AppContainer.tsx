import styled from 'styled-components';

export const AppContainerFluid = styled.div`
  ${(props) => props.backgroundImageEffect};
  background-size: 100vw 100vh;
  min-height: 90vh;
  position: relative;
  background-color: var(--${(props) => props.primaryColor});
  color: ${(props) => props.textColor};
  background-image: url(${(props) => props.backgroundImage});
  background-position: center top;
  background-repeat: no-repeat;
  overflow: hidden;
`;