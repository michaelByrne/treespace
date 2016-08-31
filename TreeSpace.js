/**
 * This is the TreeSpace constructor.
 *
 * A TreeSpace instance holds the properties and methods related to
 * a single tree layout. It expects a single TreeNode pointer,
 * which it will place as the tree's apex node or topmost root.
 * Additionally, it takes optional parameters for level spacing,
 * subtree spacing, and individual node spacing. Absent these
 * parameters, it will use defaults of 4,4, and 4.
 *
 *
 * @param   {TreeNode}   An instance of a TreeNode object
 * @param   {Number}     Level separation value
 * @param   {Number}     Node separation value
 * @param   {Number}     Subtree spacing
 * @param   {Config}     A configuration object
 * @param   {json}       A JSON object fear. data to be modeled
 * @return {TreeSpace}   A TreeSpace Instance
 */


var TreeSpace = function (rootX, rootY, collapsible) {



    //////////////////////////////////////////////
    // PUBLIC TreeSpace PROPERTIES AND METHODS
    //////////////////////////////////////////////

    /**
     * TreeSpace configuration config
     * @property config
     */

    this.config = {
        LEVEL_SEPARATION: 160,
        NODE_SEPARATION: 7,
        TREE_SEPARATION: 20,
        NODE_SIZE: 25,
        MAX_WIDTH: 25,
        MAX_DEPTH: 25,
        X_MAX: 10000,
        Y_MAX: 10000,
        X_TOP: 50,
        Y_TOP: 50
    };

    /**
     * @property {Array} List of nodes currently within tree
     */

    this.nodes = [];
    this.orderedNodes = [];

    //this.JSON_toTree(json);

    /**
     * A function to add new nodes to the TreeSpace
     * @method  addNode
     * @return  {TreeNode} A new TreeNode object
     * @param   obj
     */

    this.addNode = function (Node) {
        this.nodes.push(Node);
    };

    //////////////////////////////////////////////
    // PRIVATE TreeSpace PROPERTIES AND METHODS
    //////////////////////////////////////////////

    /**
     * @property {Array} List of first (rightmost) nodes at each level
     */

    this._prevAtLevel = new Array(this.config.MAX_DEPTH);


    switch (arguments.length) {
        case 0:
            break;
        case 2:
            this.config.X_TOP = rootX;
            this.config.Y_TOP = rootY;
            break;
        case 3:
            //handle collapsible
            break;
        default:
            throw "You have entered too many arguments";
    }


    /**
     * A private function that performs a post-order traversal of the TreeSpace
     * and assigns preliminary x coordinate and modifier values to each
     * node, calling apportion where tree balancing is needed
     * @method  _firstWalk
     * @param   {TreeNode} A TreeNode object representing the local root
     * @param   {Level} The current level within the tree
     */
    this._firstWalk = function (currNode, Level) {

        //console.log("walking " + currNode.id);
        currNode.modifier = 0; //clear modifier
        var midPoint = 0;
        currNode.prev = this._prevAtLevel[Level] || null;
        this._prevAtLevel[Level] = currNode;
        //Case where no children: If a sibling exists, set separation. Or preX is 0
        if (!(currNode.isLeaf() || Level == this.config.MAX_DEPTH)) {
            //recursively walk current node's children
            var left = currNode.getLeftMostChild();
            var right = currNode.getRightMostChild();
            this._firstWalk(left, Level + 1);

            while (left.rightSibling && (left.rightSibling != -1)) {
                left = left.rightSibling;
                this._firstWalk(left, Level + 1);
            }
            //Here we take a midpoint between the leftmost and rightmost children of a the Node being processed.
            midPoint = (currNode.children[0].preX + currNode.children[currNode.children.length - 1].preX) / 2;
            //If the Node has a sibling, we set separation and update modifier
            if (currNode.leftSibling && (currNode.leftSibling != -1)) {
                currNode.preX = currNode.leftSibling.preX + this.config.NODE_SEPARATION + this.config.NODE_SIZE;
                currNode.modifier = currNode.preX - midPoint;
                this._apportion(currNode, Level);
            }
            //Or the node is directly under the parent
            else {
                currNode.preX = midPoint;
            }
        }
        else {
            if (currNode.leftSibling && (currNode.leftSibling != -1)) {
                currNode.preX = currNode.leftSibling.preX + this.config.NODE_SEPARATION + this.config.NODE_SIZE;
                //console.log("leaf left sib .... " + currNode.id + " pre-x is now " + currNode.preX);
            }
            else {
                TreeNode.preX = 0;
                //console.log("leaf no left " + currNode.id + " pre-x is now " + currNode.preX);
            }
        }
    };

    /**
     * A private function that traces subtree contours and determines
     * whether they are sufficient or if there is subtree overlap. If
     * overlap exists, apportion will add spacing to the rightmost
     * of the two subtrees being compared. The function will then
     * add up the number of subtrees in between the two trees under
     * comparison and will allocate the additional spacing among them.
     * @method  _apportion
     * @param   {TreeNode} A TreeNode object representing left lowest
     * descendent of a tree
     * @param   {Level} The current level within the tree
     */

    this._apportion = function (currNode, Level) {
        //console.log("appr " + currNode.id);
        var leftMost = currNode.children[0];
        var depthToStop = this.config.MAX_DEPTH - Level;
        var neighbor = leftMost.prev;
        var compareDepth = 1;

        var leftModSum;
        var rightModSum;
        var leftMostAncestor;
        var rightMostAncestor;
        var neighborAncestor;
        var distance;
        var proportion;
        var tempNode;

        while ((leftMost) && (neighbor) && (compareDepth <= depthToStop)) {
            rightModSum = leftModSum = 0;
            leftMostAncestor = leftMost;
            neighborAncestor = neighbor;

            /*(* Compute the location of Leftmost and where it should *)
             (* be with respect to Neighbor. *)*/

            for (var i = 0; i < compareDepth; i++) {
                leftMostAncestor = leftMostAncestor.parent[0];
                neighborAncestor = neighborAncestor.parent[0];
                rightModSum += leftMostAncestor.modifier;
                leftModSum += neighborAncestor.modifier;
            }
            /*(* Find the moveDistance, and apply it to Node's subtree. *)
             (*Add appropriate portions to smaller interior subtrees. *)*/

            distance = (neighbor.preX +
            leftModSum +
            this.config.TREE_SEPARATION +
            this.config.NODE_SIZE -
            (leftMost.preX + rightModSum));
            //(*Count interior sibling subtrees in LeftSiblings*)//
            if (distance > 0) {
                var leftSiblings = 0;

                for (tempNode = currNode; (tempNode) && (tempNode !== neighborAncestor); tempNode = tempNode.leftSibling) {
                    leftSiblings++;
                }

                if (tempNode) {

                    proportion = distance / leftSiblings;
                    for (tempNode = currNode; (tempNode) && (tempNode !== neighborAncestor); tempNode = tempNode.leftSibling) {
                        tempNode.preX += distance;
                        tempNode.modifier += distance;

                        distance -= proportion;
                    }
                }
                else {
                    /*(* Don't need to move anything--it needs to *)
                     (* be done by an ancestor because *)
                     (* AncestorNeighbor and AncestorLeftmost are *)
                     (* not siblings of each other. *)*/
                    return;
                }
            }
            compareDepth = compareDepth + 1;
            // (* Determine the leftmost descendant of Node at the next *)
            // (* lower level to compare its positioning against that of its neighbor*)
            if (leftMost.isLeaf()) {
                leftMost = currNode.getLeftMost(0, compareDepth);
            }
            else {
                leftMost = leftMost.children[0];
            }
            if (leftMost) {
                neighbor = leftMost.prev;
            }

        }

    };


    /**
     * A private function that performs a pre-order traversal of the TreeSpace
     * and calculates final x coordinates from modifier totals to each
     * node.
     * @method  _secondWalk
     * @param   {TreeNode}  A TreeNode object to be calculated
     * @param   {Level}     The current level within the tree
     * @param   {modSum}    The current modifier sum from ancestors
     * @return  {boolean}   Success/fail
     */

    this._secondWalk = function (currNode, Level, modSum) {

        //console.log("second " + currNode.id);
        var result = true;
        /* assume innocent        */
        var tempX = 0;
        var tempY = 0;
        /* hold calculations here */
        var newModSum = 0;

        if (Level < this.config.MAX_DEPTH) {
            tempX = this.config.X_TOP + currNode.preX + modSum;
            tempY = this.config.Y_TOP + (Level * this.config.LEVEL_SEPARATION);

            if (checkExtentRange(tempX, tempY)) {
                currNode.x = tempX;
                currNode.y = tempY;

                if (currNode.children[0]) result = this._secondWalk(currNode.children[0], Level + 1, modSum + currNode.modifier);
                if (result == true && currNode.rightSibling && (currNode.rightSibling != -1))  result =
                    this._secondWalk(currNode.rightSibling, Level, modSum);
            }
            else {
                result = false;
            }

        }
        else {
            result = true;
        }
        return result;
    };

    /**
     * A public function that executes first and second walk
     * @method  _positionTree
     */

    this.positionTree = function () {
        this._firstWalk(this.nodes[0], 0);
        return this._secondWalk(this.nodes[0], 0, 0);
    };
};

/**
 * Function to load pages in raw json and deserialize them into list of TreeNode objects
 *
 * @param  {Array}   Array of pages in raw JSON data, AKA results.Data
 * @return {TreeSpace}   An Array of TreeNode objects
 */


TreeSpace.prototype.loadTreeNodes = function (results) {
    var treeNodeObjects = results.Data;
    var treeNodesMap = new Map();
    this.nodes.length = 0;
    this.orderedNodes.length = 0;


    for (var i = 0; i < treeNodeObjects.length; i++) {
        var treeNodeRaw = treeNodeObjects[i];
        var node = new TreeNode([], null, null, [], treeNodeRaw.ID);
        treeNodesMap.set(treeNodeRaw.ID, node);
    }

    for (var i = 0; i < treeNodeObjects.length; i++) {
        var treeNodeRaw = treeNodeObjects[i];
        var node = treeNodesMap.get(treeNodeRaw.ID);

        // Assign sibilings
        node.leftSibling = treeNodesMap.get(treeNodeRaw.leftSibling);
        node.rightSibling = treeNodesMap.get(treeNodeRaw.rightSibling);

        // Assign children array
        for (var j = 0; j < treeNodeRaw.child.length; j++) {
            node.children.push(treeNodesMap.get(treeNodeRaw.child[j]));
        }

        // Assign children array
        for (var j = 0; j < treeNodeRaw.parent.length; j++) {
            node.parent.push(treeNodesMap.get(treeNodeRaw.parent[j]));
        }


        // Assign url and title
        node.nodeURL = treeNodeRaw.url;
        node.nodeTitle = treeNodeRaw.title;
        this.nodes.push(node);
    }
    if (results.Termination){
        this.nodes[this.nodes.length-1].terminates = true;
    }
};

/**
 * A public function that takes a tree node parameter and flips its
 * muted property from false to true or from true to false
 * @method  collapse
 * @param   {TreeNode} A TreeNode object representing the collapse point
 */

TreeSpace.prototype.collapse = function (node) {
    node.collapsed = true;
    node.muted = true;
    if (node.children[0]){
        var leftNode = node.children[node.children.length-1];
        leftNode.collapsed = true;
        leftNode.muted = true;
        this.collapse(leftNode);
        node = node.children[0];
        var tempNode = node;
        tempNode.collapsed = true;
        tempNode.muted = true;
        while (tempNode.rightSibling){
            this.collapse(tempNode);
            tempNode.rightSibling.collapsed = true;
            tempNode.rightSibling.muted = true;
            tempNode = tempNode.rightSibling;
        }
        this.collapse(node);
        if (node.children[0]){
            this.collapse(node.children[0]);
        }
        if (node.children.length > 1){
            this.collapse(node.children[node.children.length-1]);
        }
    }
    node.collapsed = true;
    node.muted = true;
    if(node.rightSibling){
        node = node.rightSibling;
        this.collapse(node);
    }
};


TreeSpace.prototype.uncollapse = function (node){
    if (node.children[0]){
        for (var i = 0;i<node.children.length;i++){
            node.children[i].muted = false;
        }
    }
}


TreeSpace.prototype.inOrderTree = function(node){
    this.orderedNodes.push(node);
    if(node.children[0]){
        this.inOrderTree(node.children[0]);
    }
    if(node.rightSibling){
        this.inOrderTree(node.rightSibling);
    }
}

TreeSpace.prototype.translateHorizontal = function(){
    for (var i = 0;i<this.orderedNodes.length;i++){
        var tem;
        tem = this.orderedNodes[i].x;
        this.orderedNodes[i].x = this.orderedNodes[i].y;
        this.orderedNodes[i].y = tem;
    }
}


/**
 * This is the TreeNode constructor.
 *
 * A TreeNode instance contains data corresponding to
 * a single node existing within a TreeSpace. It holds
 * position data for that node, as well as information
 * about the node. It is added to the TreeSpace via
 * the TreeSpace public function addNode().
 *
 *
 * @param  {Array}      An array of nodes for new nodes' parent
 * @param  {TreeNode}   The new node's left sibling if exists
 * @param  {TreeNode}   The new node's right sibling if exists
 * @param  {Array}      An array of nodes for new nodes children
 */
function TreeNode(parent, lSib, rSib, children, id) {


    //////////////////////////////////////////////
    // PUBLIC TreeNode PROPERTIES AND METHODS
    //////////////////////////////////////////////

    this.id = id;
    this.parent = parent;
    this.leftSibling = lSib;
    this.rightSibling = rSib;
    this.children = children;
    this.prev = null;
    this.preX = 0;
    this.modifier = 0;
    this.x = 0;
    this.y = 0;

    ///////////////////////////////////////
    //Additional domain-specific properties
    ///////////////////////////////////////

    this.boxLeft = null;
    this.boxRight = null;
    this.boxTop = null;
    this.boxBottom = null;
    this.bWidth = null;
    this.bHeight = null;

    this.isActive = false;
    this.terminates = false;

    this.activeFillColor = 'black';
    this.activeStrokeColor = 'white';
    this.parentStrokeColor = '#FFCE9B';
    this.parentFillColor = 'grey';
    this.nonParentFillColor = 'black';
    this.nonParentStrokeColor = 'white';
    this.hoverStrokeColor = '#36B8E3';
    this.hoverFillColor = 'grey';

    this.nodeURL = null;
    this.nodeTitle = null;
    this.displayTitle = null;


    this.collapsed = false;
    this.muted = false;


    this.isLeaf = function () {
        return this.children.length == 0;
    };

    this.isLeftMost = function () {
        if (this.parent == null) {
            return true;
        }
        return this.parent.children[0] == this;
    };

    this.isRightMost = function () {
        if (this.parent == null) {
            return true;
        }
        return this.parent.children[0] == this;
    };

    this.getLeftMostChild = function () {
        if (this.children.length == 0) {
            return null;
        }
        return this.children[0];
    };

    this.getRightMostChild = function () {
        if (this.children.length == 0) {
            return null;
        }
        return this.children[this.children.length - 1];
    };

    this.getLeftMost = function (currLevel, searchDepth) {
        var cLeftMost;
        var cRightMost;

        if (currLevel == searchDepth) {
            return this;
        }
        else if (this.isLeaf()) {
            return null;
        }
        else {
            cRightMost = this.getLeftMostChild();
            cLeftMost = cRightMost.getLeftMost(currLevel + 1, searchDepth);

            while ((cLeftMost == null) && cRightMost.rightSibling && (cRightMost.rightSibling != -1)) {
                cRightMost = cRightMost.rightSibling;
                cLeftMost = cRightMost.getLeftMost(currLevel + 1, searchDepth);
            }
            return cLeftMost;
        }
    };

    this.toString = function () {
        return "Node id: " + this.id + ", Node position: (" + this.x + ", " + this.y + "), muted: " + this.muted;
    }
}


//X and Y set to mostly arbitrary bounds for now//
function checkExtentRange(x, y) {
    return true;
}

//
// var testResponse = '{"Result_text": "Successful Web Crawl", "Count": 15, "Data": [{"parent": [], "title": "Page 0", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/0.html", "rightSibling": null, "firstChild": 1, "sibling": [], "child": [1, 2, 3], "leftSibling": null, "ID": 0}, {"parent": [0], "title": "Page E", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/E.html", "rightSibling": 2, "firstChild": 4, "sibling": [2, 3], "child": [4, 5], "leftSibling": null, "ID": 1}, {"parent": [0], "title": "Page F", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/F.html", "rightSibling": 3, "firstChild": null, "sibling": [1, 3], "child": [], "leftSibling": 1, "ID": 2}, {"parent": [0], "title": "Page N", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/N.html", "rightSibling": null, "firstChild": 6, "sibling": [1, 2], "child": [6, 7], "leftSibling": 2, "ID": 3}, {"parent": [1], "title": "Page A", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/A.html", "rightSibling": 5, "firstChild": null, "sibling": [5], "child": [], "leftSibling": null, "ID": 4}, {"parent": [1], "title": "Page D", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/D.html", "rightSibling": null, "firstChild": 8, "sibling": [4], "child": [8, 9], "leftSibling": 4, "ID": 5}, {"parent": [3], "title": "Page G", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/G.html", "rightSibling": 7, "firstChild": null, "sibling": [7], "child": [], "leftSibling": null, "ID": 6}, {"parent": [3], "title": "Page M", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/M.html", "rightSibling": null, "firstChild": 10, "sibling": [6], "child": [10, 11, 12, 13, 14], "leftSibling": 6, "ID": 7}, {"parent": [5], "title": "Page B", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/B.html", "rightSibling": 9, "firstChild": null, "sibling": [9], "child": [], "leftSibling": null, "ID": 8}, {"parent": [5], "title": "Page C", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/C.html", "rightSibling": null, "firstChild": null, "sibling": [8], "child": [], "leftSibling": 8, "ID": 9}, {"parent": [7], "title": "Page H", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/H.html", "rightSibling": 11, "firstChild": null, "sibling": [11, 12, 13, 14], "child": [], "leftSibling": null, "ID": 10}, {"parent": [7], "title": "Page I", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/I.html", "rightSibling": 12, "firstChild": null, "sibling": [10, 12, 13, 14], "child": [], "leftSibling": 10, "ID": 11}, {"parent": [7], "title": "Page J", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/J.html", "rightSibling": 13, "firstChild": null, "sibling": [10, 11, 13, 14], "child": [], "leftSibling": 11, "ID": 12}, {"parent": [7], "title": "Page K", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/K.html", "rightSibling": 14, "firstChild": null, "sibling": [10, 11, 12, 14], "child": [], "leftSibling": 12, "ID": 13}, {"parent": [7], "title": "Page L", "url": "http://web.engr.oregonstate.edu/~olsoeric/CS419/QVis/L.html", "rightSibling": null, "firstChild": null, "sibling": [10, 11, 12, 13], "child": [], "leftSibling": 13, "ID": 14}], "Result": 0, "Termination": false}';
// var testTree = new TreeSpace();
// var response = JSON.parse(testResponse);
// testTree.loadTreeNodes(response);
// testTree.positionTree();
// testTree.inOrderTree(testTree.nodes[0]);
// //testTree.collapse(testTree.nodes[5]);
//
// for (var j = 0;j<testTree.nodes.length;j++){
// console.log(testTree.orderedNodes[j].toString());
// }





//exports.TreeSpace = TreeSpace;
//exports.TreeNode = TreeNode;
