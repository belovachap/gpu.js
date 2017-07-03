/**
 * @class FunctionBuilderBase
 *
 * [INTERNAL] A collection of functionNodes.
 *
 * This handles all the raw state, converted state, etc. Of a single function.
 *
 * @param {Object} nodeMap - Object map, where nodeMap[function] = new FunctionNode;
 * @param {Object} gpu - The current gpu instance bound to this builder
 * @param {Object} rootKernel - The root kernel object, contains the paramNames, dimensions etc.
 *
 */
module.exports = class FunctionBuilderBase {

	/**
	 * @name FunctionBuilderBase
	 * @function
	 *
	 * @constructor Blank constructor, which initializes the properties
	 *
	 */
	constructor(gpu) {
		this.nodeMap = {};
		this.gpu = gpu;
		this.rootKernel = null;
	}

	/**
	 * @name addFunction
	 * @function
	 *
	 * Instantiates a FunctionNode, and add it to the nodeMap
	 *
	 * @param {GPU} gpu - The GPU instance
	 * @param {String} functionName - Function name to assume, if its null, it attempts to extract from the function
	 * @param {Function} jsFunction - JS Function to do conversion
	 * @param {[String,...]|{variableName: Type,...}} paramTypes - Parameter type array, assumes all parameters are 'float' if null
	 * @param {String} returnType - The return type, assumes 'float' if null
	 *
	 */
	addFunction(functionName, jsFunction, paramTypes, returnType) {
		throw new Error('addFunction not supported on base');
	}

	/**
	 * @name addFunctionNode
	 * @function
	 *
	 * Add the funciton node directly
	 *
	 * @param {functionNode} inNode - functionNode to add
	 *
	 */
	addFunctionNode(inNode) {
		this.nodeMap[inNode.functionName] = inNode;
		if (inNode.isRootKernel) {
			this.rootKernel = inNode;
		}
	}

	/**
	 * @name traceFunctionCalls
	 * @function
	 *
	 * Trace all the depending functions being called, from a single function
	 *
	 * This allow for 'unneeded' functions to be automatically optimized out.
	 * Note that the 0-index, is the starting function trace.
	 *
	 * @param {String} functionName - Function name to trace from, default to 'kernel'
	 * @param {[String,...]} retList - Returning list of function names that is traced. Including itself.
	 *
	 * @returns {[String,...]}  Returning list of function names that is traced. Including itself.
	 */
	traceFunctionCalls(functionName, retList, parent) {
		functionName = functionName || 'kernel';
		retList = retList || [];

		const fNode = this.nodeMap[functionName];
		if (fNode) {
			// Check if function already exists
			if (retList.indexOf(functionName) >= 0) {
				// Does nothing if already traced
			} else {
				retList.push(functionName);
				fNode.parent = parent;
				fNode.getFunctionString(); //ensure JS trace is done
				for (let i = 0; i < fNode.calledFunctions.length; ++i) {
					this.traceFunctionCalls(fNode.calledFunctions[i], retList, fNode);
				}
			}
		}

		return retList;
	}




	//---------------------------------------------------------
	//
	//  Polyfill stuff
	//
	//---------------------------------------------------------

	// Round function used in polyfill
	static round(a) {
		return round(a);
	}

	/**
	 * @name polyfillStandardFunctions
	 * @function
	 *
	 * Polyfill in the missing Math functions (round)
	 *
	 */
	polyfillStandardFunctions() {
		this.addFunction('round', round);
	}
};

function round(a) {
	return Math.floor(a + 0.5);
}