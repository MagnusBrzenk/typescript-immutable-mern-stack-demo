////////////////////////////////////////////////////////////////////
//Vendor Modules
import * as React from "react";
import { connect } from "react-redux";
//My Modules & namespaces
import { CONTACT, FRONTENDFILTERS, ROOTSTATE } from "__MODELS";
import { ContactItem } from "__COMPONENTS/ContactItem";
import { AppActions } from "__REDUX/actions";
import {
    selectAllContactItems,
    selectActiveContactItems,
    selectInactiveContactItems,
    selectDisplayItemsFilter,
    selectWordForSearching,
    getFetchFeedInProgress
} from "__REDUX/selectors";
import { fromEvent, Subscription } from "rxjs"; //Get types and/or observable-creation functions
import { debounceTime, map } from "rxjs/operators"; //Get piping operators
import PREZ from "__UTILS/frontendPresentation";

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

//Props to arrive from parent component (as opposed to redux store)
interface IParentProps {
    width?: string;
    heightPxls: number;
}

//Never change IProps for containers; it will always be determined by the intersection of these 3 interfaces:
type IProps = IReduxStateToProps & IReduxCallbacks & IParentProps;

interface IState {
    width: string;
    heightPxls: number;
    allContactItems: CONTACT.ImTypes;
    contactItemFontSizePercent: string;
    bScrollHandlerLocked: boolean;
}

////////////////////////////////////////////////////////////////////
class ContactfeedComponent extends React.Component<IProps, IState> {
    ////////////////////////////////////////////////////////////////

    private scrollerDivId: string = "contact-feed-id";
    private scrollSubscription: Subscription | undefined;

    constructor(props: IProps) {
        super(props);
        this.state = {
            width: this.props.width ? this.props.width : "100%",
            heightPxls: this.props.heightPxls,
            allContactItems: this.props.allContactItems,
            contactItemFontSizePercent: PREZ.getDynamicFontSizePrcnt("xlarge") + "%",
            bScrollHandlerLocked: false
        };
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }

    componentDidMount() {
        //Feed width resizing, etc.
        window.addEventListener("resize", this.handleWindowResize);

        //Fetch the first batch of contacts
        this.props.cbFetchMoreContacts();

        //Set up infinite scroll:
        const feedTriggerBufferPxls: number = 300;
        const scrollDiv: HTMLElement | null = document.getElementById(this.scrollerDivId);
        if (!scrollDiv) return;
        this.scrollSubscription = fromEvent(scrollDiv, "scroll")
            .pipe(
                debounceTime(100),
                map(() => ({
                    bLoadMore:
                        scrollDiv!.scrollTop > //
                        scrollDiv!.scrollHeight - scrollDiv!.offsetHeight - feedTriggerBufferPxls
                }))
            )
            .subscribe(({ bLoadMore }) => {
                if (bLoadMore) this.props.cbFetchMoreContacts();
            });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleWindowResize);
        if (!!this.scrollSubscription) this.scrollSubscription.unsubscribe();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps !== this.props) {
            this.setState({
                allContactItems: this.props.allContactItems,
                heightPxls: this.props.heightPxls
            });
        }
    }

    handleWindowResize() {
        this.setState({ contactItemFontSizePercent: PREZ.getDynamicFontSizePrcnt("xlarge") + "%" });
    }

    render() {
        const displayFilter: FRONTENDFILTERS.TFilterStrings = this.props.displayItemsFilter;
        let displayedContactItems: CONTACT.ImTypes = this.props.allContactItems;
        if (displayFilter === "active") displayedContactItems = this.props.activeContactItems;
        if (displayFilter === "inactive") displayedContactItems = this.props.inactiveContactItems;

        return (
            <div className="contact-feed" id={this.scrollerDivId}>
                <style jsx>{`
                    .contact-feed {
                        width: ${this.state.width}px;
                        height: ${this.state.heightPxls}px;
                        position: relative;
                        background-color: rgba(0, 0, 0, 0.2);
                        overflow: scroll;
                        -webkit-overflow-scrolling: touch; /* for iOS momentum scrolling */
                    }
                    .contact-item-wrapper {
                        height: 100%;
                        width: 100%;
                        font-size: ${this.state.contactItemFontSizePercent};
                    }
                `}</style>
                <div className="contact-item-wrapper">
                    {!!displayedContactItems &&
                        displayedContactItems.map((el: CONTACT.ImType, ind: number | undefined, arr: any) => (
                            <span key={ind}>
                                <ContactItem
                                    key={ind}
                                    contactData={el}
                                    cbSetExpandedContact={this.props.cbSetExpandedContact}
                                    cbShowExpandedContact={this.props.cbShowExpandedContact}
                                />
                            </span>
                        ))}
                </div>
            </div>
        );
    }
}

//////////////////////////////////////////////////////////////////////////
//// Code below concerns setup of the smart props to/from redux store ////
//////////////////////////////////////////////////////////////////////////

/**
 * HEAR FROM THE REDUX STATE
 * Define props data to arrive from redux state via "memoized reslect selector functions" (see redux/selectors for description)
 */
interface IReduxStateToProps {
    allContactItems: CONTACT.ImTypes;
    activeContactItems: CONTACT.ImTypes;
    inactiveContactItems: CONTACT.ImTypes;
    displayItemsFilter: FRONTENDFILTERS.TFilterStrings;
    wordForSearching: string;
    bFetchFeedInProgress: boolean;
}
function mapStateToProps(state: ROOTSTATE.ImType): IReduxStateToProps {
    return {
        allContactItems: selectAllContactItems(state),
        activeContactItems: selectActiveContactItems(state),
        inactiveContactItems: selectInactiveContactItems(state),
        displayItemsFilter: selectDisplayItemsFilter(state),
        wordForSearching: selectWordForSearching(state),
        bFetchFeedInProgress: getFetchFeedInProgress(state)
    };
}

/**
 * SPEAK TO THE REDUX STATE
 * Define local callback functions related to your redux actions
 * These allow you to trigger your reducers from within the container
 * (and any descendant components you pass those callbacks onto) in
 * order to manipulate the redux state
 */
interface IReduxCallbacks {
    cbSetExpandedContact: typeof AppActions.setExpandedContact;
    cbShowExpandedContact: typeof AppActions.showExpandedContact;
    cbFetchMoreContacts: typeof AppActions.fetchMoreContacts;
}
const mapDispatchToProps = (dispatch: any): IReduxCallbacks => {
    return {
        cbSetExpandedContact: (newContact: CONTACT.ImType) => dispatch(AppActions.setExpandedContact(newContact)),
        cbShowExpandedContact: ({ bOpen, bEditing }: { bOpen: boolean; bEditing?: boolean }) =>
            dispatch(AppActions.showExpandedContact({ bOpen, bEditing })),
        cbFetchMoreContacts: () => dispatch(AppActions.fetchMoreContacts())
    };
};

/**
 * This is the magical "connect" function provided by redux-react that hooks the container up to the redux store.
 * It's used to create a 'Higher-Order Component' (HOC) that separates props passed from parent component (IParentProps)
 * and the props passed from the redux state (IReduxStateToProps). It's recommended that you treat these patterns
 * (mapDispatchToProps, dispatch, etc.) as brute facts of the redux magisteria
 * Note: it was tricky getting all of these typings coordinated correctly; monkey with them at your own peril!
 */
export const Contactfeed = connect<IReduxStateToProps, IReduxCallbacks, IParentProps, ROOTSTATE.ImType>(
    mapStateToProps,
    mapDispatchToProps
)(ContactfeedComponent);
